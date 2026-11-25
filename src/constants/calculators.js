export const CATEGORIES = [
  { id: 'all', name: 'All', color: '#2563EB', icon: 'LayoutGrid' },
  { id: 'everyday', name: 'Everyday', color: '#2563EB', icon: 'Calculator' },
  { id: 'financial', name: 'Financial', color: '#10B981', icon: 'Landmark' },
  { id: 'business', name: 'Business', color: '#F59E0B', icon: 'Briefcase' },
  { id: 'conversion', name: 'Conversion', color: '#8B5CF6', icon: 'ArrowLeftRight' },
  { id: 'health', name: 'Health', color: '#EF4444', icon: 'HeartPulse' },
];

export const CALCULATORS = [
  // Everyday (4)
  {
    id: 'basic',
    name: 'Basic Calculator',
    shortName: 'Basic',
    category: 'everyday',
    description: 'Standard arithmetic, percentages, and quick expressions',
    icon: 'Calculator',
    isPopular: true,
    keywords: ['math', 'arithmetic', 'add', 'subtract', 'multiply', 'divide', 'standard'],
  },
  {
    id: 'age',
    name: 'Age Calculator',
    shortName: 'Age',
    category: 'everyday',
    description: 'Exact age in years, months, days, and next birthday countdown',
    icon: 'Cake',
    isPopular: true,
    keywords: ['birthday', 'dob', 'years', 'months', 'days'],
  },
  {
    id: 'percentage',
    name: 'Percentage Calculator',
    shortName: 'Percentage',
    category: 'everyday',
    description: 'Find percentages, ratios, and percentage increase or decrease',
    icon: 'Percent',
    isPopular: true,
    keywords: ['percent', 'ratio', 'change', 'increase', 'decrease'],
  },
  {
    id: 'date-diff',
    name: 'Date Difference Calculator',
    shortName: 'Date Diff',
    category: 'everyday',
    description: 'Calculate exact duration, days, weeks, and weekdays between dates',
    icon: 'CalendarDays',
    isPopular: false,
    keywords: ['days', 'calendar', 'duration', 'between', 'dates'],
  },

  // Financial (4)
  {
    id: 'emi',
    name: 'EMI Calculator',
    shortName: 'EMI',
    category: 'financial',
    description: 'Monthly loan installment, total interest, and total payable amount',
    icon: 'Landmark',
    isPopular: true,
    keywords: ['loan', 'mortgage', 'installment', 'bank', 'interest'],
  },
  {
    id: 'gst',
    name: 'GST Calculator',
    shortName: 'GST',
    category: 'financial',
    description: 'Add or remove GST with CGST and SGST breakdown',
    icon: 'Receipt',
    isPopular: true,
    keywords: ['tax', 'cgst', 'sgst', 'inclusive', 'exclusive', 'vat'],
  },
  {
    id: 'interest',
    name: 'Interest Calculator',
    shortName: 'Interest',
    category: 'financial',
    description: 'Simple and compound interest with flexible compounding frequency',
    icon: 'TrendingUp',
    isPopular: false,
    keywords: ['simple', 'compound', 'principal', 'rate', 'maturity'],
  },
  {
    id: 'sip',
    name: 'SIP Calculator',
    shortName: 'SIP',
    category: 'financial',
    description: 'Systematic Investment Plan returns and maturity wealth estimate',
    icon: 'PiggyBank',
    isPopular: true,
    keywords: ['mutual fund', 'investment', 'monthly', 'returns', 'wealth'],
  },

  // Business (2)
  {
    id: 'discount',
    name: 'Discount Calculator',
    shortName: 'Discount',
    category: 'business',
    description: 'Final price and savings with single or stacked discounts',
    icon: 'Tag',
    isPopular: false,
    keywords: ['sale', 'offer', 'price', 'savings', 'markdown'],
  },
  {
    id: 'profit-loss',
    name: 'Profit & Loss Calculator',
    shortName: 'Profit & Loss',
    category: 'business',
    description: 'Calculate profit or loss amount and percentage margin',
    icon: 'BarChart3',
    isPopular: false,
    keywords: ['margin', 'cost', 'selling', 'revenue', 'business'],
  },

  // Conversion (3)
  {
    id: 'length',
    name: 'Length Converter',
    shortName: 'Length',
    category: 'conversion',
    description: 'Convert between mm, cm, m, km, inch, foot, yard, and mile',
    icon: 'Ruler',
    isPopular: false,
    keywords: ['distance', 'meter', 'feet', 'inch', 'km', 'mile', 'unit'],
  },
  {
    id: 'weight',
    name: 'Weight Converter',
    shortName: 'Weight',
    category: 'conversion',
    description: 'Convert between mg, g, kg, tonne, oz, lb, and stone',
    icon: 'Scale',
    isPopular: false,
    keywords: ['mass', 'kg', 'pound', 'lb', 'gram', 'ounce', 'unit'],
  },
  {
    id: 'temperature',
    name: 'Temperature Converter',
    shortName: 'Temperature',
    category: 'conversion',
    description: 'Convert between Celsius, Fahrenheit, and Kelvin',
    icon: 'Thermometer',
    isPopular: false,
    keywords: ['celsius', 'fahrenheit', 'kelvin', 'weather', 'heat', 'unit'],
  },

  // Health (2)
  {
    id: 'bmi',
    name: 'BMI Calculator',
    shortName: 'BMI',
    category: 'health',
    description: 'Body Mass Index estimate and healthy weight range',
    icon: 'Activity',
    isPopular: true,
    keywords: ['body mass index', 'weight', 'height', 'fitness', 'health'],
  },
  {
    id: 'bmr',
    name: 'BMR Calculator',
    shortName: 'BMR',
    category: 'health',
    description: 'Basal Metabolic Rate and daily calorie needs estimate',
    icon: 'Flame',
    isPopular: false,
    keywords: ['calories', 'metabolism', 'tdee', 'diet', 'fitness', 'health'],
  },
];

export function getCalculatorById(id) {
  return CALCULATORS.find((calc) => calc.id === id) || null;
}

export function getCategoryById(categoryId) {
  return CATEGORIES.find((cat) => cat.id === categoryId) || CATEGORIES[0];
}

export function filterCalculators({ category = 'all', query = '' } = {}) {
  const normalizedQuery = query.trim().toLowerCase();
  return CALCULATORS.filter((calc) => {
    const matchesCategory = category === 'all' || calc.category === category;
    if (!matchesCategory) return false;
    if (!normalizedQuery) return true;
    return (
      calc.name.toLowerCase().includes(normalizedQuery) ||
      calc.shortName.toLowerCase().includes(normalizedQuery) ||
      calc.description.toLowerCase().includes(normalizedQuery) ||
      calc.keywords.some((kw) => kw.toLowerCase().includes(normalizedQuery))
    );
  });
}
