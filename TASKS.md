# One Calculator — Development Roadmap & Task Tracker

## Progress Summary

- **Total Tasks:** 30
- **Completed Tasks:** 30
- **Pending Tasks:** 0
- **Current Task:** None (All MVP tasks completed)
- **Latest Test Results:** T12.2: `npx expo-doctor` (20/20 passed), `npx expo lint` (0 errors), `npm test` (48/48 passed), `npx expo export --platform android` (3471 modules bundled).
- **Known Issues:** None
- **Next Task:** None — ready for `eas build --platform android` or `npx expo start --android`

---

## Phase 1: Project Inspection and Configuration

- [x] **Task ID:** T1.1
- **Task Name:** Install core Expo dependencies & configure app.json / package.json
- **Description:** Install Expo Router, SQLite, AsyncStorage, Lucide React Native, Clipboard, Haptics, and required peer dependencies using `npx expo install`. Update `package.json` (`main: "expo-router/entry"`) and `app.json` (scheme, `userInterfaceStyle: "automatic"`, Android package config).
- **Dependencies:** None
- **Implementation Requirements:**
  - Run `npx expo install expo-router expo-sqlite @react-native-async-storage/async-storage lucide-react-native react-native-svg expo-clipboard expo-haptics react-native-safe-area-context react-native-screens expo-linking expo-constants`
  - Configure `app.json` with `scheme: "onecalculator"`, `userInterfaceStyle: "automatic"`, and `android.package`.
  - Update `package.json` `main` to `"expo-router/entry"`.
- **Testing Requirements:**
  - Verify `npx expo-doctor` passes.
  - Verify all packages resolve cleanly in `package.json`.
- **Completion Status:** COMPLETED

- [x] **Task ID:** T1.2
- **Task Name:** Configure linting and unit test runner
- **Description:** Set up `npx expo lint` (ESLint) and a Node test script (`npm test` using `node --test`) so every task can be linted and unit-tested cleanly.
- **Dependencies:** T1.1
- **Implementation Requirements:**
  - Add `"lint": "expo lint"` and `"test": "node --test tests/**/*.test.mjs"` (or `.js`) in `package.json`.
  - Ensure `npx expo lint` runs without configuration errors.
- **Testing Requirements:**
  - Run `npx expo lint` and `npm test` with a smoke test.
- **Completion Status:** COMPLETED

---

## Phase 2: Folder Architecture and Navigation

- [x] **Task ID:** T2.1
- **Task Name:** Create folder architecture and 5-tab Expo Router layout
- **Description:** Establish `src/` directory structure (`src/app/`, `src/components/`, `src/constants/`, `src/context/`, `src/db/`, `src/utils/`) and implement root `_layout.js` and `(tabs)/_layout.js` with 5 bottom tabs: Home, Tools, Favorites, History, Settings.
- **Dependencies:** T1.1, T1.2
- **Implementation Requirements:**
  - Configure `expo-router` root `src/app/_layout.js` with `SafeAreaProvider` and Stack navigator.
  - Create `src/app/(tabs)/_layout.js` with 5 tabs using Lucide icons (`Home`, `Grid`, `Star`, `History`, `Settings`).
  - Create initial placeholder-free screen shells for all 5 tabs so navigation works end-to-end.
  - Remove unused root `App.js` / `index.js` if superseded by `expo-router/entry` (or keep minimal compatibility).
- **Testing Requirements:**
  - Run `npx expo lint` and verify bundle compilation via `npx expo export --platform android`.
- **Completion Status:** COMPLETED

- [x] **Task ID:** T2.2
- **Task Name:** Create calculator registry and dynamic calculator routing
- **Description:** Define `src/constants/calculators.js` containing metadata for all 15 calculators (id, name, shortName, category, description, icon, route, isPopular, keywords) and set up `src/app/calculator/[id].js` to route to each calculator screen cleanly.
- **Dependencies:** T2.1
- **Implementation Requirements:**
  - Register all 15 calculators across 5 categories: Everyday (4), Financial (4), Business (2), Conversion (3), Health (2).
  - Implement `src/app/calculator/[id].js` with proper header title, back navigation, and graceful fallback if an unknown ID is opened.
- **Testing Requirements:**
  - Unit test verifying all 15 calculators have unique IDs, valid categories, and required metadata.
  - Run `npx expo lint`.
- **Completion Status:** COMPLETED

---

## Phase 3: Design System and Reusable Components

- [x] **Task ID:** T3.1
- **Task Name:** Implement Theme System (Light, Dark, System)
- **Description:** Create `src/constants/theme.js` with design tokens (colors, typography, spacing, radii, shadows) and `src/context/ThemeContext.js` supporting Light, Dark, and System themes.
- **Dependencies:** T2.1
- **Implementation Requirements:**
  - Define accessible contrast-checked palettes for Light and Dark modes.
  - Provide `useTheme()` hook returning `{ theme, themeMode, setThemeMode, isDark }`.
  - Wrap root layout in `ThemeProvider` and sync `StatusBar` style.
- **Testing Requirements:**
  - Unit test theme token completeness (every key in light exists in dark).
  - Run `npx expo lint`.
- **Completion Status:** COMPLETED

- [x] **Task ID:** T3.2
- **Task Name:** Build core reusable UI components
- **Description:** Build themed UI primitives in `src/components/ui/`: `ScreenContainer`, `Card`, `Button`, `InputField`, `SegmentedControl`, `CategoryChip`, `EmptyState`, and `CalculatorCard`.
- **Dependencies:** T3.1
- **Implementation Requirements:**
  - All components adapt to `useTheme()`.
  - `InputField` supports label, suffix/prefix, numeric/decimal keyboardType, error text, and clear button.
  - `Button` supports primary, secondary, outline, and ghost variants with optional haptic feedback.
- **Testing Requirements:**
  - Run `npx expo lint` and verify imports/exports.
- **Completion Status:** COMPLETED

- [x] **Task ID:** T3.3
- **Task Name:** Build CalculatorLayout and ResultCard components
- **Description:** Create `src/components/calculator/CalculatorLayout.js` and `src/components/calculator/ResultCard.js` providing consistent Calculate/Reset actions, Copy, Share, Favorite toggle, error display, and optional disclaimer banner.
- **Dependencies:** T3.2
- **Implementation Requirements:**
  - `ResultCard` displays primary result, breakdown rows, Copy button (`expo-clipboard`), and Share button (`Share.share`).
  - `CalculatorLayout` provides ScrollView with `keyboardShouldPersistTaps="handled"`, header Favorite toggle, and error banner.
- **Testing Requirements:**
  - Run `npx expo lint`.
- **Completion Status:** COMPLETED

---

## Phase 4: Home Screen and Categories

- [x] **Task ID:** T4.1
- **Task Name:** Implement Home screen
- **Description:** Build `src/app/(tabs)/index.js` with One Calculator branding, search bar (navigating/filtering), Popular calculators, Calculator categories, Recently used calculators, and Quick access to favorites.
- **Dependencies:** T2.2, T3.2
- **Implementation Requirements:**
  - Search bar filters calculators inline or jumps to Tools with query.
  - Category cards navigate to Tools filtered by that category.
  - Recently used & Favorites sections render dynamically from storage/context.
- **Testing Requirements:**
  - Run `npx expo lint` and verify bundle export.
- **Completion Status:** COMPLETED

- [x] **Task ID:** T4.2
- **Task Name:** Implement Tools screen
- **Description:** Build `src/app/(tabs)/tools.js` displaying all 15 calculators with category filter chips (All, Everyday, Financial, Business, Conversion, Health) and live search input.
- **Dependencies:** T2.2, T3.2
- **Implementation Requirements:**
  - Support initial category/query params passed from Home screen.
  - Show empty state when search/filter yields no matches with a "Clear Filters" action.
- **Testing Requirements:**
  - Unit test search and category filtering helper logic.
  - Run `npx expo lint`.
- **Completion Status:** COMPLETED

---

## Phase 5: Everyday Calculators

- [x] **Task ID:** T5.1
- **Task Name:** Implement Basic Calculator
- **Description:** Build `src/utils/calculators/basic.js` (safe arithmetic expression parser/evaluator, no `eval`) and Basic Calculator UI with keypad, expression display, live/equals evaluation, copy, share, and history logging.
- **Dependencies:** T3.3
- **Implementation Requirements:**
  - Support `+`, `-`, `*`, `/`, `%`, decimals, `+/-`, backspace, `C`, and `=`.
  - Handle division by zero and malformed expressions safely.
- **Testing Requirements:**
  - Unit tests for arithmetic precedence, decimals, percentages, and division by zero.
  - Run `npx expo lint`.
- **Completion Status:** COMPLETED

- [x] **Task ID:** T5.2
- **Task Name:** Implement Age Calculator
- **Description:** Build `src/utils/calculators/age.js` and Age Calculator UI calculating exact age in years, months, days, plus total months, weeks, days, and days until next birthday.
- **Dependencies:** T3.3
- **Implementation Requirements:**
  - Accept Date of Birth (`YYYY-MM-DD`) and Target Date (default today) with calendar/date validation.
  - Validate DOB <= Target Date and leap-year accuracy.
- **Testing Requirements:**
  - Unit tests for known birthdates, leap years, and invalid date errors.
  - Run `npx expo lint`.
- **Completion Status:** COMPLETED

- [x] **Task ID:** T5.3
- **Task Name:** Implement Percentage Calculator
- **Description:** Build `src/utils/calculators/percentage.js` and Percentage Calculator UI supporting three modes: "X% of Y", "X is what % of Y", and "% Change from X to Y".
- **Dependencies:** T3.3
- **Implementation Requirements:**
  - Segmented mode selector, clear labels per mode, validation for zero denominators.
- **Testing Requirements:**
  - Unit tests for all 3 modes including negative changes and zero-division guards.
  - Run `npx expo lint`.
- **Completion Status:** COMPLETED

- [x] **Task ID:** T5.4
- **Task Name:** Implement Date Difference Calculator
- **Description:** Build `src/utils/calculators/dateDiff.js` and Date Difference Calculator UI computing exact years, months, days, total days, total weeks, and weekdays between two dates.
- **Dependencies:** T3.3
- **Implementation Requirements:**
  - Accept Start Date and End Date (`YYYY-MM-DD`), handle reversed dates gracefully or show clear breakdown.
- **Testing Requirements:**
  - Unit tests for same-day, cross-month, cross-leap-year, and invalid date inputs.
  - Run `npx expo lint`.
- **Completion Status:** COMPLETED

---

## Phase 6: Financial Calculators

- [x] **Task ID:** T6.1
- **Task Name:** Implement EMI Calculator
- **Description:** Build `src/utils/calculators/emi.js` and EMI Calculator UI computing monthly EMI, total interest payable, and total payment from loan amount, annual interest rate, and tenure (months or years).
- **Dependencies:** T3.3
- **Implementation Requirements:**
  - Standard formula: $EMI = P \cdot r \cdot \frac{(1+r)^n}{(1+r)^n - 1}$, plus 0% interest edge case ($P / n$).
  - Validate positive principal and tenure, non-negative rate.
- **Testing Requirements:**
  - Unit tests against known EMI examples and 0% interest edge case.
  - Run `npx expo lint`.
- **Completion Status:** COMPLETED

- [x] **Task ID:** T6.2
- **Task Name:** Implement GST Calculator
- **Description:** Build `src/utils/calculators/gst.js` and GST Calculator UI supporting Exclusive (Add GST) and Inclusive (Remove GST) modes, quick tax rate presets (5%, 12%, 18%, 28%), and CGST/SGST breakdown.
- **Dependencies:** T3.3
- **Implementation Requirements:**
  - Show base amount, GST amount, CGST (50%), SGST (50%), and total amount.
- **Testing Requirements:**
  - Unit tests for exclusive and inclusive GST formulas.
  - Run `npx expo lint`.
- **Completion Status:** COMPLETED

- [x] **Task ID:** T6.3
- **Task Name:** Implement Simple and Compound Interest Calculator
- **Description:** Build `src/utils/calculators/interest.js` and UI supporting Simple Interest and Compound Interest with selectable compounding frequency (Annually, Semi-Annually, Quarterly, Monthly).
- **Dependencies:** T3.3
- **Implementation Requirements:**
  - Display interest earned, principal, and total maturity amount.
- **Testing Requirements:**
  - Unit tests for simple interest and all compound frequencies.
  - Run `npx expo lint`.
- **Completion Status:** COMPLETED

- [x] **Task ID:** T6.4
- **Task Name:** Implement SIP Calculator
- **Description:** Build `src/utils/calculators/sip.js` and SIP Calculator UI computing total invested amount, estimated wealth gain, and maturity value from monthly SIP, expected annual return %, and years.
- **Dependencies:** T3.3
- **Implementation Requirements:**
  - Standard SIP future value formula with monthly compounding: $FV = P \cdot \frac{(1+i)^n - 1}{i} \cdot (1+i)$, plus 0% return edge case.
- **Testing Requirements:**
  - Unit tests against verified SIP examples and 0% return edge case.
  - Run `npx expo lint`.
- **Completion Status:** COMPLETED

---

## Phase 7: Business Calculators

- [x] **Task ID:** T7.1
- **Task Name:** Implement Discount Calculator
- **Description:** Build `src/utils/calculators/discount.js` and Discount Calculator UI computing final price and total savings from original price, discount %, and optional additional discount % or tax %.
- **Dependencies:** T3.3
- **Implementation Requirements:**
  - Validate price >= 0 and discount between 0 and 100.
- **Testing Requirements:**
  - Unit tests for single discount, stacked discount, and invalid percentage inputs.
  - Run `npx expo lint`.
- **Completion Status:** COMPLETED

- [x] **Task ID:** T7.2
- **Task Name:** Implement Profit and Loss Calculator
- **Description:** Build `src/utils/calculators/profitLoss.js` and Profit & Loss Calculator UI computing profit or loss amount, percentage, and break-even status from cost price and selling price.
- **Dependencies:** T3.3
- **Implementation Requirements:**
  - Clearly indicate Profit, Loss, or Break-even with appropriate status color.
  - Guard against Cost Price <= 0.
- **Testing Requirements:**
  - Unit tests for profit, loss, break-even, and zero cost price validation.
  - Run `npx expo lint`.
- **Completion Status:** COMPLETED

---

## Phase 8: Conversion Calculators

- [x] **Task ID:** T8.1
- **Task Name:** Implement Length Converter
- **Description:** Build `src/utils/calculators/length.js` and Length Converter UI supporting mm, cm, m, km, inch, foot, yard, mile with unit swap and full multi-unit conversion table.
- **Dependencies:** T3.3
- **Implementation Requirements:**
  - Accurate conversion factors via meter base unit.
- **Testing Requirements:**
  - Unit tests for metric-to-imperial and reverse conversions.
  - Run `npx expo lint`.
- **Completion Status:** COMPLETED

- [x] **Task ID:** T8.2
- **Task Name:** Implement Weight Converter
- **Description:** Build `src/utils/calculators/weight.js` and Weight Converter UI supporting mg, g, kg, metric ton, oz, lb, stone with unit swap and multi-unit breakdown.
- **Dependencies:** T3.3
- **Implementation Requirements:**
  - Accurate conversion factors via kilogram base unit.
- **Testing Requirements:**
  - Unit tests for kg-to-lb, oz-to-g, and edge cases.
  - Run `npx expo lint`.
- **Completion Status:** COMPLETED

- [x] **Task ID:** T8.3
- **Task Name:** Implement Temperature Converter
- **Description:** Build `src/utils/calculators/temperature.js` and Temperature Converter UI supporting Celsius, Fahrenheit, and Kelvin with unit swap and absolute-zero validation.
- **Dependencies:** T3.3
- **Implementation Requirements:**
  - Validate temperatures cannot go below absolute zero (-273.15°C / -459.67°F / 0K).
- **Testing Requirements:**
  - Unit tests for freezing/boiling/body temp/absolute zero conversions.
  - Run `npx expo lint`.
- **Completion Status:** COMPLETED

---

## Phase 9: Health Calculators

- [x] **Task ID:** T9.1
- **Task Name:** Implement BMI Calculator
- **Description:** Build `src/utils/calculators/bmi.js` and BMI Calculator UI supporting Metric (kg, cm) and Imperial (lb, ft/in), BMI score, WHO category, healthy weight range, and clear non-medical-diagnosis disclaimer.
- **Dependencies:** T3.3
- **Implementation Requirements:**
  - Include prominent disclaimer: "Results are estimates for informational purposes only and not a medical diagnosis."
- **Testing Requirements:**
  - Unit tests for metric & imperial BMI and all category thresholds.
  - Run `npx expo lint`.
- **Completion Status:** COMPLETED

- [x] **Task ID:** T9.2
- **Task Name:** Implement BMR Calculator
- **Description:** Build `src/utils/calculators/bmr.js` and BMR Calculator UI using Mifflin-St Jeor equation with gender, age, weight, height, BMR (kcal/day), TDEE activity breakdown, and medical disclaimer.
- **Dependencies:** T3.3
- **Implementation Requirements:**
  - Support Metric & Imperial units and include non-medical-diagnosis disclaimer.
- **Testing Requirements:**
  - Unit tests for male/female Mifflin-St Jeor calculations and input validation.
  - Run `npx expo lint`.
- **Completion Status:** COMPLETED

---

## Phase 10: SQLite Database, History and Favorites

- [x] **Task ID:** T10.1
- **Task Name:** Implement SQLite database layer for History, Favorites, and Recent tools
- **Description:** Create `src/db/database.js` using `expo-sqlite` to persist calculation history, favorite calculator IDs, and recently used calculators locally offline.
- **Dependencies:** T1.1, T2.2
- **Implementation Requirements:**
  - Initialize `history`, `favorites`, and `recent_tools` tables safely.
  - Export async helpers: `addHistory`, `getHistory`, `deleteHistoryItem`, `clearHistory`, `toggleFavorite`, `getFavorites`, `isFavorite`, `recordRecentTool`, `getRecentTools`.
- **Testing Requirements:**
  - Run `npx expo lint` and verify DB module exports and SQL syntax.
- **Completion Status:** COMPLETED

- [x] **Task ID:** T10.2
- **Task Name:** Wire History & Favorites across app and build History & Favorites screens
- **Description:** Connect `AppDataContext` to SQLite DB, record calculations/favorites from all 15 calculators, and implement `Favorites` (`src/app/(tabs)/favorites.js`) and `History` (`src/app/(tabs)/history.js`) screens.
- **Dependencies:** T10.1, T4.1, T5.1–T9.2
- **Implementation Requirements:**
  - `Favorites` screen lists saved calculators with tap-to-open and remove favorite button.
  - `History` screen lists previous calculations with calculator name, timestamp, input summary, result, copy/delete item, and Clear All History confirmation.
- **Testing Requirements:**
  - Run `npx expo lint` and verify bundle export.
- **Completion Status:** COMPLETED

---

## Phase 11: Settings, Themes and Preferences

- [x] **Task ID:** T11.1
- **Task Name:** Implement PreferencesContext with AsyncStorage
- **Description:** Create `src/context/PreferencesContext.js` persisting theme mode (`light`/`dark`/`system`), decimal precision (`0`–`6`, default `2`), and haptic feedback (`true`/`false`) in AsyncStorage, and wire number formatting & haptics throughout calculators.
- **Dependencies:** T3.1, T3.3
- **Implementation Requirements:**
  - Provide `formatNumber(value)` respecting decimal precision and `triggerHaptic(type)` respecting haptic preference.
- **Testing Requirements:**
  - Unit test `formatNumber` across precisions and edge cases (`NaN`, `Infinity`, integers).
  - Run `npx expo lint`.
- **Completion Status:** COMPLETED

- [x] **Task ID:** T11.2
- **Task Name:** Implement Settings screen
- **Description:** Build `src/app/(tabs)/settings.js` with Light/Dark/System theme selector, Decimal Precision selector, Haptic Feedback toggle, About One Calculator, Privacy Policy info (100% offline, no data collection), and app version from `expo-constants`/`app.json`.
- **Dependencies:** T11.1
- **Implementation Requirements:**
  - No dead buttons; all controls persist immediately and reflect across the app.
- **Testing Requirements:**
  - Run `npx expo lint` and verify bundle export.
- **Completion Status:** COMPLETED

---

## Phase 12: Testing, Optimization and Android Release Preparation

- [x] **Task ID:** T12.1
- **Task Name:** Comprehensive unit test suite and edge-case verification
- **Description:** Ensure all 15 calculators, formatters, registry, and filters have thorough unit tests covering valid cases, boundary conditions, and invalid inputs.
- **Dependencies:** T5.1–T11.2
- **Implementation Requirements:**
  - All tests pass with `npm test`.
  - Fix any bugs or inconsistencies discovered.
- **Testing Requirements:**
  - `npm test` passes 100%.
  - `npx expo lint` passes with 0 errors.
- **Completion Status:** COMPLETED

- [x] **Task ID:** T12.2
- **Task Name:** Android production build verification & final QA
- **Description:** Verify `app.json` Android release settings (package name, versionCode, adaptiveIcon, splash), run `npx expo-doctor`, `npx expo lint`, `npm test`, and `npx expo export --platform android` to confirm production bundle builds cleanly.
- **Dependencies:** T12.1
- **Implementation Requirements:**
  - Ensure no TypeScript files or broken imports exist.
  - Ensure `TASKS.md` is 100% updated and all tasks are marked `[x] COMPLETED`.
- **Testing Requirements:**
  - `npx expo-doctor`, `npx expo lint`, `npm test`, and `npx expo export --platform android` all succeed.
- **Completion Status:** COMPLETED
