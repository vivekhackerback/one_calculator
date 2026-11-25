#!/usr/bin/env python3

import os
import sys
import re
import json
import getpass
import shutil
import subprocess
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

# ==================================================
# CONFIGURATION
# ==================================================

DEFAULT_VPS_PROJECT = Path("/home/officialtplpro/one_calculator")
PROJECT = DEFAULT_VPS_PROJECT if DEFAULT_VPS_PROJECT.exists() else Path(__file__).resolve().parent

REPOSITORY = "https://github.com/vivekhackerback/one_calculator.git"
BRANCH = "main"

# Derive Nginx folder automatically from the active project directory name
PROJECT_SLUG = re.sub(r"[^a-zA-Z0-9_]+", "_", PROJECT.name).strip("_").lower() or "app"

KEYSTORE = PROJECT / "key/my-upload-key.keystore"

AAB_SOURCE = (
    PROJECT /
    "android/app/build/outputs/bundle/release/app-release.aab"
)

APK_SOURCE = (
    PROJECT /
    "android/app/build/outputs/apk/release/app-release.apk"
)

NGINX_DIR = Path(os.getenv("NGINX_DIR", f"/var/www/{PROJECT_SLUG}_apk"))
AAB_DEST = NGINX_DIR / "app-release.aab"
APK_DEST = NGINX_DIR / "app-release.apk"

SERVER_IP = os.getenv("SERVER_IP", "34.47.166.2")
AAB_DOWNLOAD_URL = f"http://{SERVER_IP}/app-release.aab"
APK_DOWNLOAD_URL = f"http://{SERVER_IP}/app-release.apk"
DOWNLOAD_URL = AAB_DOWNLOAD_URL  # Kept for backward compatibility

BACKUP_DIR = Path.home() / f"{PROJECT_SLUG}_backup"

# ==================================================
# COMMAND EXECUTOR
# ==================================================

def run(command, cwd=None, env=None):
    cmd_list = list(command) if isinstance(command, (list, tuple)) else [command]

    # Resolve executable if needed on Windows (e.g. npx -> npx.cmd)
    if sys.platform == "win32" and cmd_list:
        first = str(cmd_list[0])
        if not Path(first).is_absolute():
            resolved = shutil.which(first)
            if resolved:
                cmd_list[0] = resolved

    cmd_str = " ".join(map(str, cmd_list))
    print(f"\n$ {cmd_str}", flush=True)

    try:
        subprocess.run(
            cmd_list,
            cwd=cwd,
            env=env,
            check=True
        )
    except subprocess.CalledProcessError as error:
        print("\n" + "!" * 60, file=sys.stderr)
        print("COMMAND EXECUTION FAILED", file=sys.stderr)
        print(f"Failed Command : {cmd_str}", file=sys.stderr)
        print(f"Exit Code      : {error.returncode}", file=sys.stderr)
        if cwd:
            print(f"Working Dir    : {cwd}", file=sys.stderr)
        print("!" * 60, file=sys.stderr)
        sys.exit(error.returncode if error.returncode != 0 else 1)
    except Exception as error:
        print("\n" + "!" * 60, file=sys.stderr)
        print("COMMAND EXECUTION ERROR", file=sys.stderr)
        print(f"Failed Command : {cmd_str}", file=sys.stderr)
        print(f"Error Details  : {error}", file=sys.stderr)
        print("!" * 60, file=sys.stderr)
        sys.exit(1)


# ==================================================
# BUILD TARGET SELECTION
# ==================================================

def select_build_target():
    # Check for help flags
    for arg in sys.argv[1:]:
        if arg in ("-h", "--help", "help"):
            print("\nUsage: python3 vps_python_script.py [TARGET] [OPTIONS]")
            print("\nTargets:")
            print("  --aab, -aab           Build signed Android App Bundle (.aab)")
            print("  --apk, -apk           Build signed APK (.apk)")
            print("  --both, -both         Build and deploy both signed AAB and APK")
            print("  --apk-no-key, -nokey  Build & deploy APK without release keystore")
            print("\nOptions:")
            print("  --version-code, -vc <num>  Override Android versionCode")
            print("  BUILD_TARGET=apk/aab/both/apk-unsigned")
            print("  VERSION_CODE=<num>         Set versionCode via environment variable\n")
            sys.exit(0)

    # 1. Check CLI arguments
    for i, arg in enumerate(sys.argv[1:], start=1):
        clean_arg = arg.strip().lower()
        if clean_arg in ("--aab", "-aab"):
            return "aab"
        if clean_arg in ("--apk", "-apk"):
            return "apk"
        if clean_arg in ("--both", "-both"):
            return "both"
        if clean_arg in ("--apk-no-key", "--no-key", "-nokey", "--unsigned-apk", "--apk-unsigned"):
            return "apk-unsigned"
        if clean_arg in ("--target", "-t", "--build-type", "--type") and i + 1 < len(sys.argv):
            val = sys.argv[i + 1].strip().lower()
            if val in ("aab", "apk", "both", "apk-unsigned", "apk-no-key"):
                return "apk-unsigned" if val == "apk-no-key" else val
        if clean_arg.startswith("--target=") or clean_arg.startswith("--type="):
            val = clean_arg.split("=", 1)[1].strip().lower()
            if val in ("aab", "apk", "both", "apk-unsigned", "apk-no-key"):
                return "apk-unsigned" if val == "apk-no-key" else val
        if clean_arg in ("aab", "apk", "both", "apk-unsigned"):
            return clean_arg

    # 2. Check environment variable
    env_target = os.getenv("BUILD_TARGET") or os.getenv("BUILD_TYPE")
    if env_target:
        env_target = env_target.strip().lower()
        if env_target in ("aab", "apk", "both", "apk-unsigned"):
            return env_target
        if env_target in ("apk-no-key", "no-key", "nokey", "unsigned", "4"):
            return "apk-unsigned"
        if env_target == "1":
            return "aab"
        if env_target == "2":
            return "apk"
        if env_target == "3":
            return "both"

    # 3. Interactive prompt
    print("\n" + "=" * 50)
    print("SELECT BUILD TARGET:")
    print("  [1] AAB          - Signed Android App Bundle (Play Store)")
    print("  [2] APK          - Signed APK file (Release keystore)")
    print("  [3] Both         - Build and deploy both signed AAB and APK")
    print("  [4] APK (No Key) - Build & deploy APK without release keystore")
    print("=" * 50)

    while True:
        try:
            choice = input("Select build target [1/2/3/4] (Default: 1 - AAB): ").strip().lower()
            if not choice or choice in ("1", "aab"):
                return "aab"
            if choice in ("2", "apk"):
                return "apk"
            if choice in ("3", "both"):
                return "both"
            if choice in ("4", "apk-unsigned", "apk-no-key", "nokey", "no-key"):
                return "apk-unsigned"
            print("Invalid choice. Please enter 1, 2, 3, or 4.")
        except (KeyboardInterrupt, EOFError):
            print("\nOperation cancelled by user.")
            sys.exit(0)


# ==================================================
# SIGNING CREDENTIALS
# ==================================================

def get_signing_credentials():
    print("\n[1/14] Checking signing credentials")

    if not KEYSTORE.exists():
        raise FileNotFoundError(
            f"Keystore not found: {KEYSTORE}"
        )

    env = os.environ.copy()

    env["KEYSTORE_PATH"] = str(KEYSTORE.resolve().as_posix())
    env["RELEASE_STORE_FILE"] = str(KEYSTORE.resolve().as_posix())

    env["KEYSTORE_PASSWORD"] = (
        os.getenv("KEYSTORE_PASSWORD")
        or getpass.getpass("Keystore password: ")
    )

    env["KEY_ALIAS"] = (
        os.getenv("KEY_ALIAS")
        or input("Key alias: ").strip()
    )

    env["KEY_PASSWORD"] = (
        os.getenv("KEY_PASSWORD")
        or getpass.getpass("Key password: ")
    )

    for key in [
        "KEYSTORE_PASSWORD",
        "KEY_ALIAS",
        "KEY_PASSWORD"
    ]:
        if not env[key]:
            raise ValueError(f"{key} is missing")

    return env


# ==================================================
# BACKUP LOCAL GIT CHANGES
# ==================================================

def backup_local_changes():
    print("\n[2/14] Checking local Git changes")

    result = subprocess.run(
        ["git", "status", "--porcelain"],
        cwd=PROJECT,
        capture_output=True,
        text=True,
        check=True
    )

    if not result.stdout.strip():
        print("No local changes found.")
        return

    BACKUP_DIR.mkdir(parents=True, exist_ok=True)

    # Preserve important local configuration files
    for filename in [
        "app.json",
        "package.json",
        "package-lock.json"
    ]:
        source = PROJECT / filename
        if source.exists():
            destination = BACKUP_DIR / filename
            shutil.copy2(source, destination)
            print(f"Backup created: {destination}")

    # Stash all tracked and untracked changes
    run([
        "git", "stash", "push", "-u",
        "-m", "Automatic backup before Android deployment"
    ], cwd=PROJECT)

    print("Local changes safely stashed.")


# ==================================================
# UPDATE GITHUB REPOSITORY (GIT PULL)
# ==================================================

def update_repository():
    print("\n" + "=" * 50)
    print("[STAGE: Git Pull] [3/14]")
    print("=" * 50)
    print(f"Git pull started: Fetching latest code from {REPOSITORY} (branch: {BRANCH})...")

    run(
        ["git", "fetch", "origin"],
        cwd=PROJECT
    )

    run(
        ["git", "pull", "--ff-only", "origin", BRANCH],
        cwd=PROJECT
    )

    run(
        ["git", "log", "-1", "--oneline"],
        cwd=PROJECT
    )

    print("Git pull completed successfully.")


# ==================================================
# INSTALL DEPENDENCIES
# ==================================================

def install_dependencies():
    print("\n[4/14] Installing Node dependencies")

    run(
        ["npm", "ci"],
        cwd=PROJECT
    )


# ==================================================
# CHECK PROJECT CONFIGURATION
# ==================================================

def check_project_config():
    print("\n" + "=" * 50)
    print("[STAGE: Project Configuration Check] [5/14]")
    print("=" * 50)
    print("Project configuration check started...")

    app_json_file = PROJECT / "app.json"
    package_json_file = PROJECT / "package.json"

    if not app_json_file.exists():
        raise FileNotFoundError(f"Configuration file missing: {app_json_file}")
    if not package_json_file.exists():
        raise FileNotFoundError(f"Configuration file missing: {package_json_file}")

    try:
        with open(app_json_file, "r", encoding="utf-8") as f:
            app_data = json.load(f)
    except Exception as e:
        raise ValueError(f"Invalid app.json syntax: {e}")

    try:
        with open(package_json_file, "r", encoding="utf-8") as f:
            pkg_data = json.load(f)
    except Exception as e:
        raise ValueError(f"Invalid package.json syntax: {e}")

    expo_cfg = app_data.get("expo", {})
    app_name = expo_cfg.get("name", "Unknown")
    version_name = expo_cfg.get("version", pkg_data.get("version", "Unknown"))
    android_cfg = expo_cfg.get("android", {})
    package_name = android_cfg.get("package", "Unknown")
    version_code = android_cfg.get("versionCode", "Unknown")

    print(f"  App Name     : {app_name}")
    print(f"  Package Name : {package_name}")
    print(f"  Version Name : {version_name}")
    print(f"  Version Code : {version_code}")
    print("Project configuration check completed successfully.")


# ==================================================
# VERIFY KEYSTORE & CERTIFICATE FINGERPRINTS
# ==================================================

def verify_keystore(env):
    print("\n[6/14] Verifying existing release keystore and fingerprints")

    keytool_bin = shutil.which("keytool") or "keytool"

    try:
        result = subprocess.run([
            keytool_bin,
            "-list",
            "-v",
            "-keystore", str(KEYSTORE),
            "-alias", env["KEY_ALIAS"],
            "-storepass", env["KEYSTORE_PASSWORD"]
        ], capture_output=True, text=True, check=True)

        print("\n--- Keystore Certificate Details ---")
        for line in result.stdout.splitlines():
            line_strip = line.strip()
            if any(line_strip.startswith(prefix) for prefix in [
                "Owner:", "Issuer:", "Valid from:", "SHA1:", "SHA256:"
            ]):
                print(f"  {line_strip}")
        print("------------------------------------")
    except subprocess.CalledProcessError as e:
        print(f"[ERROR] Keystore verification failed with alias '{env['KEY_ALIAS']}':", file=sys.stderr)
        if e.stderr:
            print(e.stderr, file=sys.stderr)
        raise


# ==================================================
# SYNC ANDROID VERSION CODE & NAME
# ==================================================

def sync_android_version():
    print("\n[7/14] Synchronizing Android versionCode and versionName")

    gradle_file = PROJECT / "android/app/build.gradle"
    app_json_file = PROJECT / "app.json"
    package_json_file = PROJECT / "package.json"

    target_code = None
    target_name = None

    # 1. Read app.json if available
    if app_json_file.exists():
        try:
            with open(app_json_file, "r", encoding="utf-8") as f:
                app_data = json.load(f)
            expo_cfg = app_data.get("expo", {})
            target_name = expo_cfg.get("version")
            android_cfg = expo_cfg.get("android", {})
            target_code = android_cfg.get("versionCode")
        except Exception as e:
            print(f"Warning reading app.json: {e}")

    # 2. Read package.json as fallback for versionName
    if not target_name and package_json_file.exists():
        try:
            with open(package_json_file, "r", encoding="utf-8") as f:
                pkg_data = json.load(f)
            target_name = pkg_data.get("version")
        except Exception:
            pass

    if not target_name:
        target_name = "1.0.0"

    # 3. Read current versionCode from android/app/build.gradle if it exists
    current_gradle_code = None
    if gradle_file.exists():
        content = gradle_file.read_text(encoding="utf-8")
        match = re.search(r"versionCode\s+(\d+)", content)
        if match:
            current_gradle_code = int(match.group(1))

    # 4. Check for command-line arguments or environment variable override
    forced_code = None
    for i, arg in enumerate(sys.argv):
        if arg in ("--version-code", "-vc") and i + 1 < len(sys.argv):
            if sys.argv[i + 1].isdigit():
                forced_code = int(sys.argv[i + 1])
        elif arg.isdigit() and int(arg) > 0:
            forced_code = int(arg)

    env_override = os.getenv("VERSION_CODE")
    if env_override and env_override.strip().isdigit():
        forced_code = int(env_override.strip())

    # 5. Enforce minimum versionCode >= 1
    if forced_code is not None:
        target_code = forced_code
    else:
        candidates = [c for c in [target_code, current_gradle_code] if c is not None]
        base_code = max(candidates) if candidates else 1
        target_code = max(base_code, 1)

    print(f"Target versionCode : {target_code} (previous in Gradle: {current_gradle_code})")
    print(f"Target versionName : {target_name}")

    # 6. Synchronize app.json first so prebuild reads updated values
    if app_json_file.exists():
        try:
            with open(app_json_file, "r", encoding="utf-8") as f:
                app_data = json.load(f)
            if "expo" in app_data:
                app_data["expo"]["version"] = target_name
                if "android" not in app_data["expo"]:
                    app_data["expo"]["android"] = {}
                app_data["expo"]["android"]["versionCode"] = target_code
            with open(app_json_file, "w", encoding="utf-8") as f:
                json.dump(app_data, f, indent=2)
            print(f"Updated {app_json_file.name} -> versionCode {target_code}, version \"{target_name}\"")
        except Exception as e:
            print(f"Warning updating app.json: {e}")

    # 7. Update android/app/build.gradle if it already exists
    if gradle_file.exists():
        content = gradle_file.read_text(encoding="utf-8")

        new_content = re.sub(
            r"versionCode\s+\d+",
            f"versionCode {target_code}",
            content,
            count=1
        )

        new_content = re.sub(
            r'versionName\s+["\'][^"\']+["\']',
            f'versionName "{target_name}"',
            new_content,
            count=1
        )

        gradle_file.write_text(new_content, encoding="utf-8")
        print(f"Updated {gradle_file.name} -> versionCode {target_code}, versionName \"{target_name}\"")


# ==================================================
# RUN EXPO ANDROID PREBUILD
# ==================================================

def run_android_prebuild():
    print("\n" + "=" * 50)
    print("[STAGE: Android Prebuild] [8/14]")
    print("=" * 50)
    print("Android prebuild started: Generating fresh native Android project with Expo...")

    android_dir = PROJECT / "android"

    # Explicitly ensure any old native android directory is removed
    # to guarantee we NEVER reuse an old Android folder
    if android_dir.exists():
        print(f"Cleaning existing Android native folder: {android_dir}")
        shutil.rmtree(android_dir, ignore_errors=True)

    prebuild_env = os.environ.copy()
    prebuild_env["CI"] = "1"
    prebuild_env["EXPO_NO_TELEMETRY"] = "1"

    # Run the exact required Expo prebuild command
    run(
        ["npx", "expo", "prebuild", "--platform", "android", "--clean"],
        cwd=PROJECT,
        env=prebuild_env
    )

    print("Android prebuild completed successfully.")


# ==================================================
# VERIFY GENERATED ANDROID PROJECT
# ==================================================

def verify_android_project():
    print("\n" + "=" * 50)
    print("[STAGE: Android Folder Verification] [9/14]")
    print("=" * 50)
    print("Android folder verification started: Checking generated files...")

    android_dir = PROJECT / "android"

    if not android_dir.exists() or not android_dir.is_dir():
        raise FileNotFoundError(
            f"Android folder verification failed: Android folder missing: {android_dir}"
        )

    essential_files = [
        android_dir / "build.gradle",
        android_dir / "app" / "build.gradle",
        android_dir / "settings.gradle",
        android_dir / "gradle.properties",
        android_dir / "gradlew",
    ]

    for file_path in essential_files:
        if not file_path.exists():
            raise FileNotFoundError(
                f"Android folder verification failed: Essential file missing: {file_path}"
            )
        if file_path.is_file() and file_path.stat().st_size == 0:
            raise ValueError(
                f"Android folder verification failed: Essential file is empty (0 bytes): {file_path}"
            )
        print(f"  [OK] Verified: {file_path.relative_to(PROJECT)}")

    # Ensure gradlew has executable permissions on POSIX / Linux systems
    gradlew_path = android_dir / "gradlew"
    if gradlew_path.exists() and sys.platform != "win32":
        try:
            current_mode = gradlew_path.stat().st_mode
            gradlew_path.chmod(current_mode | 0o755)
            print("  [OK] Ensured gradlew has executable permissions (+x)")
        except Exception as e:
            print(f"  [WARN] Failed to set gradlew executable permission: {e}")

    print("Android folder verification completed successfully.")


# ==================================================
# CONFIGURE RELEASE SIGNING IN GRADLE
# ==================================================

def configure_release_signing(env):
    print("\n" + "=" * 50)
    print("[STAGE: Configure Release Signing] [10/14]")
    print("=" * 50)
    print("Configuring release keystore signing in android/app/build.gradle...")

    gradle_file = PROJECT / "android/app/build.gradle"
    if not gradle_file.exists():
        raise FileNotFoundError(f"build.gradle not found at {gradle_file}")

    content = gradle_file.read_text(encoding="utf-8")

    keystore_posix = KEYSTORE.resolve().as_posix()
    env["RELEASE_STORE_FILE"] = keystore_posix

    release_signing_block = f"""        release {{
            def storeFilePath = System.getenv("RELEASE_STORE_FILE") ?: "{keystore_posix}"
            storeFile file(storeFilePath)
            storePassword System.getenv("KEYSTORE_PASSWORD")
            keyAlias System.getenv("KEY_ALIAS")
            keyPassword System.getenv("KEY_PASSWORD")
        }}
"""

    # 1. Add release signingConfig if not already present in signingConfigs
    if "signingConfigs {" in content:
        signing_configs_section = content.split("signingConfigs {", 1)[1].split("buildTypes {", 1)[0]
        if "release {" not in signing_configs_section:
            content = content.replace(
                "signingConfigs {",
                f"signingConfigs {{\n{release_signing_block}",
                1
            )
            print("  [OK] Added 'release' signingConfig to android/app/build.gradle")
        else:
            print("  [OK] 'release' signingConfig already present")

    # 2. Switch release buildType signingConfig from debug to release
    # Expo default is: release { ... signingConfig signingConfigs.debug ... }
    release_pattern = r'(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?signingConfig\s+)signingConfigs\.debug'
    if re.search(release_pattern, content):
        content = re.sub(release_pattern, r'\g<1>signingConfigs.release', content, count=1)
        print("  [OK] Switched buildTypes.release signingConfig from 'debug' to 'release'")
    else:
        print("  [INFO] buildTypes.release is already using release signingConfig")

    gradle_file.write_text(content, encoding="utf-8")
    print("Release signing configured successfully in android/app/build.gradle.")


# ==================================================
# REMOVE OLD GRADLE BUILD FILES
# ==================================================

def clean_gradle():
    print("\n[11/14] Removing old Gradle build files")

    android = PROJECT / "android"

    folders = [
        android / ".gradle",
        android / "build",
        android / "app" / "build"
    ]

    for folder in folders:
        if folder.exists():
            print(f"Removing: {folder}")
            shutil.rmtree(folder, ignore_errors=True)
        else:
            print(f"Already clean: {folder}")

    # Remove any existing .apk / .aab outputs to prevent reusing old builds
    outputs_base = PROJECT / "android/app/build/outputs"
    if outputs_base.exists():
        for old_art in outputs_base.glob("**/*"):
            if old_art.is_file() and old_art.suffix in (".apk", ".aab"):
                try:
                    old_art.unlink()
                except Exception:
                    pass

    print("Gradle cleanup completed.")


# ==================================================
# BUILD ANDROID ARTIFACTS (AAB / APK)
# ==================================================

def build_artifacts(env, target):
    android = PROJECT / "android"

    tasks = []
    if target in ("aab", "both"):
        tasks.append("bundleRelease")
    if target in ("apk", "both", "apk-unsigned"):
        tasks.append("assembleRelease")

    target_display = " + ".join(tasks)
    print("\n" + "=" * 50)
    print(f"[STAGE: APK/AAB Build] [12/14]")
    print("=" * 50)
    print(f"APK/AAB build started: Running Gradle [{target_display}] for target: {target.upper()}...")

    # Clear old build artifacts before building to prevent reusing stale artifacts
    for old_file in [AAB_SOURCE, APK_SOURCE]:
        if old_file.exists():
            print(f"Removing old build artifact: {old_file}")
            try:
                old_file.unlink()
            except Exception:
                pass

    gradle_cmd = "./gradlew" if sys.platform != "win32" else "gradlew.bat"

    run([
        gradle_cmd,
        *tasks,
        "--no-daemon",
        "--no-build-cache"
    ], cwd=android, env=env)

    print(f"APK/AAB build completed successfully [{target_display}].")


# Backward compatibility helper
def build_aab(env):
    return build_artifacts(env, "aab")


# ==================================================
# VERIFY BUILD ARTIFACTS
# ==================================================

def verify_artifacts(target):
    print("\n" + "=" * 50)
    print("[STAGE: Build Artifact Verification] [13/14]")
    print("=" * 50)
    print("Build artifact verification started...")

    artifacts = []

    if target in ("aab", "both"):
        if not AAB_SOURCE.exists():
            raise FileNotFoundError(
                f"Build artifact verification failed: AAB was not generated: {AAB_SOURCE}"
            )
        size_bytes = AAB_SOURCE.stat().st_size
        if size_bytes == 0:
            raise ValueError(
                f"Build artifact verification failed: Generated AAB is 0 bytes: {AAB_SOURCE}"
            )
        size_mb = size_bytes / (1024 * 1024)
        print(f"  [OK] AAB generated and verified: {AAB_SOURCE} ({size_mb:.2f} MB, {size_bytes} bytes)")
        artifacts.append({
            "type": "AAB",
            "name": "Android App Bundle (.aab)",
            "source": AAB_SOURCE,
            "dest": AAB_DEST,
            "url": AAB_DOWNLOAD_URL,
        })

    if target in ("apk", "both", "apk-unsigned"):
        actual_apk = APK_SOURCE
        if not actual_apk.exists():
            apk_dir = PROJECT / "android/app/build/outputs/apk/release"
            candidates = [f for f in apk_dir.glob("*.apk") if f.is_file()] if apk_dir.exists() else []
            if candidates:
                actual_apk = sorted(candidates, key=lambda f: f.stat().st_mtime, reverse=True)[0]
            else:
                raise FileNotFoundError(
                    f"Build artifact verification failed: APK was not generated: {APK_SOURCE}"
                )
        size_bytes = actual_apk.stat().st_size
        if size_bytes == 0:
            raise ValueError(
                f"Build artifact verification failed: Generated APK is 0 bytes: {actual_apk}"
            )
        size_mb = size_bytes / (1024 * 1024)
        print(f"  [OK] APK generated and verified: {actual_apk} ({size_mb:.2f} MB, {size_bytes} bytes)")
        artifacts.append({
            "type": "APK",
            "name": "Android Package (.apk)",
            "source": actual_apk,
            "dest": APK_DEST,
            "url": APK_DOWNLOAD_URL,
        })

    print("Build artifact verification completed successfully.")
    return artifacts


# ==================================================
# VERIFY ARTIFACT SIGNATURE & CERTIFICATE FINGERPRINTS
# ==================================================

def verify_signatures(artifacts):
    print("\nVerifying artifact signature(s) and certificate fingerprints...")

    keytool_bin = shutil.which("keytool") or "keytool"

    for item in artifacts:
        print(f"\nVerifying {item['type']} signature: {item['source'].name}")
        run([
            "jarsigner",
            "-verify",
            "-certs",
            str(item["source"])
        ], cwd=PROJECT)

        # Inspect certificate fingerprint from the signed package
        try:
            result = subprocess.run([
                keytool_bin,
                "-printcert",
                "-jarfile", str(item["source"])
            ], capture_output=True, text=True, check=True)

            print(f"\n--- {item['type']} Signing Certificate Fingerprint ---")
            for line in result.stdout.splitlines():
                line_strip = line.strip()
                if any(line_strip.startswith(prefix) for prefix in [
                    "Owner:", "Issuer:", "Valid from:", "SHA1:", "SHA256:"
                ]):
                    print(f"  {line_strip}")
            print("-----------------------------------------------------")
        except Exception as e:
            print(f"  [WARN] Could not read certificate fingerprint from {item['source'].name}: {e}")

    print("All signature and fingerprint verifications completed successfully.")


# Backward compatibility helper
def verify_signature(artifacts=None):
    if artifacts is None:
        artifacts = [{"type": "AAB", "source": AAB_SOURCE}]
    verify_signatures(artifacts)


# ==================================================
# DEPLOY TO NGINX
# ==================================================

def deploy_to_nginx(artifacts):
    print("\n" + "=" * 50)
    print("[STAGE: File Deployment] [14/14]")
    print("=" * 50)
    print(f"File deployment started: Deploying artifact(s) to Nginx directory ({NGINX_DIR})...")

    run(["sudo", "mkdir", "-p", str(NGINX_DIR)])
    run(["sudo", "chmod", "755", "/var"])
    run(["sudo", "chmod", "755", "/var/www"])
    run(["sudo", "chmod", "755", str(NGINX_DIR)])

    for item in artifacts:
        run([
            "sudo", "install",
            "-m", "644",
            str(item["source"]),
            str(item["dest"])
        ])
        print(f"  [OK] {item['type']} deployed successfully to: {item['dest']}")

    # Sync Nginx root directory to the current project's NGINX_DIR
    sync_nginx_root_cmd = (
        f"for f in /etc/nginx/sites-enabled/* /etc/nginx/conf.d/*.conf; do "
        f"[ -f \"$f\" ] && grep -qE 'root\\s+/var/www/' \"$f\" && "
        f"sed -i -E 's|root\\s+/var/www/[^;]+;|root {NGINX_DIR};|g' \"$f\" && "
        f"echo \"Updated Nginx root in $f -> {NGINX_DIR}\"; "
        f"done; true"
    )
    run(["sudo", "bash", "-c", sync_nginx_root_cmd])

    run(["sudo", "nginx", "-t"])
    run(["sudo", "systemctl", "reload", "nginx"])

    print("File deployment completed successfully.")


# ==================================================
# VERIFY DOWNLOAD
# ==================================================

def verify_deployment(artifacts):
    print("\nTesting download URL(s)...")

    for item in artifacts:
        dest = item["dest"]
        url = item["url"]
        src = item["source"]

        if not dest.exists():
            raise FileNotFoundError(
                f"{item['type']} missing from Nginx directory: {dest}"
            )

        if src.stat().st_size != dest.stat().st_size:
            raise RuntimeError(f"Deployed {item['type']} size mismatch.")

        request = Request(url, method="HEAD")

        try:
            with urlopen(request, timeout=30) as response:
                if response.status != 200:
                    raise RuntimeError(
                        f"Download failed for {item['type']} ({url}): HTTP {response.status}"
                    )
                print(f"HTTP Status for {item['type']} ({url}): {response.status}")
        except HTTPError as e:
            raise RuntimeError(
                f"Download failed for {item['type']} ({url}): HTTP {e.code} {e.reason}"
            )
        except URLError as e:
            raise RuntimeError(
                f"Could not reach {url}: {e.reason}"
            )

    print("All download URLs verified successfully.")


# ==================================================
# MAIN
# ==================================================

def main():
    print("=" * 60)
    print("ONE CALCULATOR - AUTOMATIC ANDROID PREBUILD & DEPLOYMENT")
    print("=" * 60)

    try:
        if not (PROJECT / ".git").exists():
            raise RuntimeError("Git repository not found.")

        # Step 1: Select build target (AAB / APK / Both / APK without key)
        target = select_build_target()
        requires_release_key = target != "apk-unsigned"
        print(f"\nTarget artifact selected: {target.upper()}")
        print(f"Nginx deployment folder : {NGINX_DIR}")

        # Step 2: Obtain signing credentials (skip for unsigned/no-key APK)
        if requires_release_key:
            env = get_signing_credentials()
        else:
            print("\n[1/14] Skipping release keystore (APK without key selected)")
            env = os.environ.copy()

        # Step 3: Stash and backup local Git changes
        backup_local_changes()

        # Step 4: [STAGE: Git Pull] Fetch and pull latest repository code
        update_repository()

        # Step 5: Install Node dependencies
        install_dependencies()

        # Step 6: [STAGE: Project Configuration Check] Check project configuration
        check_project_config()

        # Step 7: Verify release keystore & certificate fingerprint
        if requires_release_key:
            verify_keystore(env)
        else:
            print("\n[6/14] Skipping release keystore verification (no-key APK)")

        # Step 8: Sync versions in app.json before prebuild
        sync_android_version()

        # Step 9: [STAGE: Android Prebuild] Fresh Expo Android prebuild
        run_android_prebuild()

        # Step 10: [STAGE: Android Folder Verification] Verify generated Android files
        verify_android_project()

        # Step 11: [STAGE: Configure Release Signing] Inject release signingConfig into build.gradle
        if requires_release_key:
            configure_release_signing(env)
        else:
            print("\n[10/14] Keeping default debug signingConfig for no-key APK")

        # Step 12: Sync Android Gradle version and clean old Gradle cache
        sync_android_version()
        clean_gradle()

        # Step 13: [STAGE: APK/AAB Build] Build requested artifacts
        build_artifacts(env, target)

        # Step 14: [STAGE: Build Artifact Verification] Check generated artifacts
        artifacts = verify_artifacts(target)

        # Step 15: Verify digital signatures & display fingerprints
        if requires_release_key:
            verify_signatures(artifacts)
        else:
            print("\nSkipping release signature verification (no-key APK)")

        # Step 16: [STAGE: File Deployment] Deploy to Nginx & reload
        deploy_to_nginx(artifacts)

        # Step 17: Verify download URL
        verify_deployment(artifacts)

        print("\n" + "=" * 60)
        print("SUCCESS: ANDROID ARTIFACT(S) PREBUILT & DEPLOYED")
        print("=" * 60)

        print("\nGitHub repository:")
        print(REPOSITORY)

        for item in artifacts:
            print(f"\n{item['type']} location:")
            print(item["dest"])
            print(f"{item['type']} Download URL:")
            print(item["url"])

    except subprocess.CalledProcessError as error:
        print("\n" + "!" * 60, file=sys.stderr)
        print("DEPLOYMENT FAILED: Process returned non-zero exit code", file=sys.stderr)
        print(f"Command exit code: {error.returncode}", file=sys.stderr)
        print("!" * 60, file=sys.stderr)
        sys.exit(error.returncode if error.returncode != 0 else 1)

    except Exception as error:
        print("\n" + "!" * 60, file=sys.stderr)
        print("DEPLOYMENT FAILED", file=sys.stderr)
        print(f"Error: {error}", file=sys.stderr)
        print("!" * 60, file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
