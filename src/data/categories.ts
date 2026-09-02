export interface CategoryInfo {
  id: string;
  name: string;
  nameEnglish: string;
  description: string;
  color: string;
  bgLight: string;
  bgDark: string;
  iconName: string;
}

export const CATEGORIES: CategoryInfo[] = [
  {
    id: "all",
    name: "બધી વાર્તાઓ",
    nameEnglish: "All Stories",
    description: "સમગ્ર બોધકથાઓનો સંગ્રહ",
    color: "text-amber-700 dark:text-amber-300",
    bgLight: "bg-amber-100 text-amber-900 border-amber-300",
    bgDark: "dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800",
    iconName: "BookOpen"
  },
  {
    id: "bhakti",
    name: "ભક્તિ અને શ્રદ્ધા",
    nameEnglish: "Devotion & Faith",
    description: "ભગવાન અને સંત પ્રત્યે અખૂટ શ્રદ્ધા અને સમર્પણ",
    color: "text-rose-600 dark:text-rose-300",
    bgLight: "bg-rose-50 text-rose-800 border-rose-200",
    bgDark: "dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-800",
    iconName: "Heart"
  },
  {
    id: "seva",
    name: "સેવા અને નમ્રતા",
    nameEnglish: "Service & Humility",
    description: "નિઃસ્વાર્થ સેવા, નિર્માનીપણું અને સમર્પણ",
    color: "text-emerald-700 dark:text-emerald-300",
    bgLight: "bg-emerald-50 text-emerald-800 border-emerald-200",
    bgDark: "dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800",
    iconName: "Hands"
  },
  {
    id: "satsang",
    name: "સત્સંગ અને સંગ મહિમા",
    nameEnglish: "Good Company & Satsang",
    description: "મોટા પુરુષનો સંગ, સુહૃદભાવ અને એકતા",
    color: "text-blue-700 dark:text-blue-300",
    bgLight: "bg-blue-50 text-blue-800 border-blue-200",
    bgDark: "dark:bg-blue-950/40 dark:text-blue-200 dark:border-blue-800",
    iconName: "Users"
  },
  {
    id: "vivek",
    name: "વિવેક અને બુદ્ધિ",
    nameEnglish: "Wisdom & Prudence",
    description: "જીવનમાં સાચી સમજણ, વિવેક અને વાણી સંયમ",
    color: "text-purple-700 dark:text-purple-300",
    bgLight: "bg-purple-50 text-purple-800 border-purple-200",
    bgDark: "dark:bg-purple-950/40 dark:text-purple-200 dark:border-purple-800",
    iconName: "Sparkles"
  },
  {
    id: "vairagya",
    name: "ત્યાગ અને વૈરાગ્ય",
    nameEnglish: "Detachment & Renunciation",
    description: "માયા અને સંસારની અસ્થિરતામાંથી મુક્તિ",
    color: "text-orange-700 dark:text-orange-300",
    bgLight: "bg-orange-50 text-orange-800 border-orange-200",
    bgDark: "dark:bg-orange-950/40 dark:text-orange-200 dark:border-orange-800",
    iconName: "Flame"
  },
  {
    id: "niyam",
    name: "નિયમ-ધર્મ અને ટેક",
    nameEnglish: "Discipline & Vows",
    description: "સત્ય, પ્રામાણિકતા અને દ્રઢ નિયમ પાલન",
    color: "text-cyan-700 dark:text-cyan-300",
    bgLight: "bg-cyan-50 text-cyan-800 border-cyan-200",
    bgDark: "dark:bg-cyan-950/40 dark:text-cyan-200 dark:border-cyan-800",
    iconName: "ShieldCheck"
  }
];
