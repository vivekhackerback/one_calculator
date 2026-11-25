import {
  Activity,
  ArrowLeftRight,
  BarChart3,
  Briefcase,
  Cake,
  Calculator,
  CalendarDays,
  Flame,
  HeartPulse,
  Landmark,
  LayoutGrid,
  Percent,
  PiggyBank,
  Receipt,
  Ruler,
  Scale,
  Tag,
  Thermometer,
  TrendingUp,
} from 'lucide-react-native';

const ICON_MAP = {
  Activity,
  ArrowLeftRight,
  BarChart3,
  Briefcase,
  Cake,
  Calculator,
  CalendarDays,
  Flame,
  HeartPulse,
  Landmark,
  LayoutGrid,
  Percent,
  PiggyBank,
  Receipt,
  Ruler,
  Scale,
  Tag,
  Thermometer,
  TrendingUp,
};

export function CalculatorIcon({ name, size = 22, color = '#2563EB' }) {
  const IconComponent = ICON_MAP[name] || Calculator;
  return <IconComponent size={size} color={color} />;
}
