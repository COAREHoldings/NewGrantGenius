export interface JournalData {
  name: string;
  impactFactor: number;
  acceptanceRate: number;
  reviewTime: number; // days
  categories: string[];
  openAccess: boolean;
  publisher: string;
  issn?: string;
}

export const JOURNALS: JournalData[] = [
  { name: 'Nature', impactFactor: 64.8, acceptanceRate: 7, reviewTime: 60, categories: ['multidisciplinary', 'biology', 'medicine'], openAccess: false, publisher: 'Springer Nature' },
  { name: 'Science', impactFactor: 56.9, acceptanceRate: 6, reviewTime: 55, categories: ['multidisciplinary', 'biology', 'physics'], openAccess: false, publisher: 'AAAS' },
  { name: 'Cell', impactFactor: 66.8, acceptanceRate: 8, reviewTime: 65, categories: ['biology', 'cell biology', 'molecular biology'], openAccess: false, publisher: 'Elsevier' },
  { name: 'Nature Medicine', impactFactor: 82.9, acceptanceRate: 6, reviewTime: 70, categories: ['medicine', 'translational'], openAccess: false, publisher: 'Springer Nature' },
  { name: 'New England Journal of Medicine', impactFactor: 176.1, acceptanceRate: 5, reviewTime: 45, categories: ['medicine', 'clinical'], openAccess: false, publisher: 'NEJM Group' },
  { name: 'The Lancet', impactFactor: 168.9, acceptanceRate: 5, reviewTime: 50, categories: ['medicine', 'clinical', 'public health'], openAccess: false, publisher: 'Elsevier' },
  { name: 'JAMA', impactFactor: 120.7, acceptanceRate: 7, reviewTime: 40, categories: ['medicine', 'clinical'], openAccess: false, publisher: 'AMA' },
  { name: 'Nature Communications', impactFactor: 16.6, acceptanceRate: 25, reviewTime: 90, categories: ['multidisciplinary', 'biology', 'physics'], openAccess: true, publisher: 'Springer Nature' },
  { name: 'PLOS ONE', impactFactor: 3.7, acceptanceRate: 55, reviewTime: 120, categories: ['multidisciplinary'], openAccess: true, publisher: 'PLOS' },
  { name: 'Scientific Reports', impactFactor: 4.6, acceptanceRate: 45, reviewTime: 100, categories: ['multidisciplinary'], openAccess: true, publisher: 'Springer Nature' },
  { name: 'eLife', impactFactor: 7.7, acceptanceRate: 15, reviewTime: 80, categories: ['biology', 'medicine'], openAccess: true, publisher: 'eLife Sciences' },
  { name: 'PNAS', impactFactor: 11.1, acceptanceRate: 18, reviewTime: 75, categories: ['multidisciplinary', 'biology'], openAccess: false, publisher: 'NAS' },
  { name: 'Journal of Clinical Investigation', impactFactor: 15.9, acceptanceRate: 12, reviewTime: 60, categories: ['medicine', 'translational'], openAccess: true, publisher: 'ASCI' },
  { name: 'Circulation', impactFactor: 37.8, acceptanceRate: 10, reviewTime: 50, categories: ['cardiology', 'medicine'], openAccess: false, publisher: 'AHA' },
  { name: 'Cancer Research', impactFactor: 11.2, acceptanceRate: 15, reviewTime: 70, categories: ['oncology', 'cancer biology'], openAccess: false, publisher: 'AACR' },
  { name: 'Neuron', impactFactor: 16.2, acceptanceRate: 10, reviewTime: 65, categories: ['neuroscience'], openAccess: false, publisher: 'Elsevier' },
  { name: 'Immunity', impactFactor: 32.4, acceptanceRate: 8, reviewTime: 60, categories: ['immunology'], openAccess: false, publisher: 'Elsevier' },
  { name: 'Nature Neuroscience', impactFactor: 25.0, acceptanceRate: 8, reviewTime: 70, categories: ['neuroscience'], openAccess: false, publisher: 'Springer Nature' },
  { name: 'Journal of Neuroscience', impactFactor: 5.3, acceptanceRate: 25, reviewTime: 85, categories: ['neuroscience'], openAccess: false, publisher: 'SfN' },
  { name: 'Diabetes', impactFactor: 7.7, acceptanceRate: 20, reviewTime: 60, categories: ['endocrinology', 'diabetes'], openAccess: false, publisher: 'ADA' },
];

export function getJournalsByCategory(category: string): JournalData[] {
  return JOURNALS.filter(j => j.categories.some(c => c.toLowerCase().includes(category.toLowerCase())));
}
