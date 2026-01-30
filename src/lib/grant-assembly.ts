// Progressive Grant Assembly System
// Tracks completion and builds final grant package

export interface GrantSection {
  id: string;
  name: string;
  category: 'required' | 'conditional' | 'optional';
  pageLimit?: number;
  status: 'not_started' | 'in_progress' | 'draft' | 'complete' | 'locked';
  content: string;
  wordCount: number;
  lastModified: string;
  completionPercentage: number;
  validationErrors: string[];
  validationWarnings: string[];
}

export interface GrantPackage {
  applicationId: string;
  title: string;
  fundingMechanism: string;
  dueDate?: string;
  sections: Record<string, GrantSection>;
  overallProgress: number;
  readyForSubmission: boolean;
  lastAssembled?: string;
}

// All NIH/SBIR/STTR sections
export const GRANT_SECTIONS = {
  // Core Scientific Sections
  specific_aims: { name: 'Specific Aims', category: 'required', pageLimit: 1 },
  research_strategy: { name: 'Research Strategy', category: 'required', pageLimit: 12 },
  abstract: { name: 'Project Summary/Abstract', category: 'required', pageLimit: 1 },
  narrative: { name: 'Project Narrative', category: 'required', pageLimit: 1 },
  
  // Resources & Environment
  facilities: { name: 'Facilities & Other Resources', category: 'required', pageLimit: null },
  equipment: { name: 'Equipment', category: 'required', pageLimit: null },
  
  // Regulatory Sections
  human_subjects: { name: 'Protection of Human Subjects', category: 'conditional', pageLimit: null },
  vertebrate_animals: { name: 'Vertebrate Animals', category: 'conditional', pageLimit: null },
  inclusion_enrollment: { name: 'Inclusion Enrollment Report', category: 'conditional', pageLimit: null },
  
  // Data & Resource Plans
  data_sharing: { name: 'Data Sharing Plan', category: 'required', pageLimit: 2 },
  authentication_plan: { name: 'Authentication of Key Biological Resources', category: 'conditional', pageLimit: 1 },
  resource_sharing: { name: 'Resource Sharing Plan', category: 'conditional', pageLimit: null },
  
  // Budget
  budget: { name: 'Budget', category: 'required', pageLimit: null },
  budget_justification: { name: 'Budget Justification', category: 'required', pageLimit: 3 },
  
  // Personnel
  biosketches: { name: 'Biographical Sketches', category: 'required', pageLimit: 5 },
  other_support: { name: 'Other Support', category: 'required', pageLimit: null },
  
  // Support Letters
  letters_support: { name: 'Letters of Support', category: 'optional', pageLimit: null },
  letters_consultant: { name: 'Consultant Letters', category: 'conditional', pageLimit: null },
  letters_vendor: { name: 'Vendor/Supplier Letters', category: 'conditional', pageLimit: null },
  
  // SBIR/STTR Specific
  commercialization: { name: 'Commercialization Plan', category: 'conditional', pageLimit: 10 },
  regulatory_plan: { name: 'Regulatory Strategy', category: 'conditional', pageLimit: null },
  
  // Subawards
  subaward_docs: { name: 'Subaward Documents', category: 'conditional', pageLimit: null }
} as const;

// Initialize empty grant package
export function initGrantPackage(applicationId: string, mechanism: string): GrantPackage {
  const sections: Record<string, GrantSection> = {};
  
  Object.entries(GRANT_SECTIONS).forEach(([id, config]) => {
    sections[id] = {
      id,
      name: config.name,
      category: config.category,
      pageLimit: config.pageLimit,
      status: 'not_started',
      content: '',
      wordCount: 0,
      lastModified: '',
      completionPercentage: 0,
      validationErrors: [],
      validationWarnings: []
    };
  });
  
  return {
    applicationId,
    title: '',
    fundingMechanism: mechanism,
    sections,
    overallProgress: 0,
    readyForSubmission: false
  };
}

// Update section content
export function updateSection(
  pkg: GrantPackage,
  sectionId: string,
  content: string
): GrantPackage {
  const section = pkg.sections[sectionId];
  if (!section) return pkg;
  
  const wordCount = content.trim().split(/\s+/).filter(w => w).length;
  const pageEstimate = Math.ceil(wordCount / 500);
  
  // Validate
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (section.pageLimit && pageEstimate > section.pageLimit) {
    errors.push(`Exceeds ${section.pageLimit} page limit (est. ${pageEstimate} pages)`);
  }
  
  if (wordCount < 50 && section.category === 'required') {
    warnings.push('Content may be too brief for a required section');
  }
  
  // Calculate completion
  let completionPercentage = 0;
  if (wordCount > 0) completionPercentage = 25;
  if (wordCount > 100) completionPercentage = 50;
  if (wordCount > 300) completionPercentage = 75;
  if (errors.length === 0 && wordCount > 200) completionPercentage = 100;
  
  const updatedSection: GrantSection = {
    ...section,
    content,
    wordCount,
    lastModified: new Date().toISOString(),
    completionPercentage,
    status: completionPercentage === 100 ? 'complete' : completionPercentage > 0 ? 'in_progress' : 'not_started',
    validationErrors: errors,
    validationWarnings: warnings
  };
  
  const updatedSections = { ...pkg.sections, [sectionId]: updatedSection };
  
  // Recalculate overall progress
  const requiredSections = Object.values(updatedSections).filter(s => s.category === 'required');
  const totalRequired = requiredSections.length;
  const completedRequired = requiredSections.filter(s => s.status === 'complete').length;
  const overallProgress = Math.round((completedRequired / totalRequired) * 100);
  
  return {
    ...pkg,
    sections: updatedSections,
    overallProgress,
    readyForSubmission: overallProgress === 100 && requiredSections.every(s => s.validationErrors.length === 0)
  };
}

// Get sections by status
export function getSectionsByStatus(pkg: GrantPackage, status: GrantSection['status']): GrantSection[] {
  return Object.values(pkg.sections).filter(s => s.status === status);
}

// Get required but incomplete sections
export function getIncompleteSections(pkg: GrantPackage): GrantSection[] {
  return Object.values(pkg.sections).filter(
    s => s.category === 'required' && s.status !== 'complete' && s.status !== 'locked'
  );
}

// Get all validation issues
export function getAllValidationIssues(pkg: GrantPackage): {
  errors: Array<{ section: string; message: string }>;
  warnings: Array<{ section: string; message: string }>;
} {
  const errors: Array<{ section: string; message: string }> = [];
  const warnings: Array<{ section: string; message: string }> = [];
  
  Object.values(pkg.sections).forEach(section => {
    section.validationErrors.forEach(msg => errors.push({ section: section.name, message: msg }));
    section.validationWarnings.forEach(msg => warnings.push({ section: section.name, message: msg }));
  });
  
  return { errors, warnings };
}

// Lock section (prevent further editing)
export function lockSection(pkg: GrantPackage, sectionId: string): GrantPackage {
  const section = pkg.sections[sectionId];
  if (!section || section.status !== 'complete') return pkg;
  
  return {
    ...pkg,
    sections: {
      ...pkg.sections,
      [sectionId]: { ...section, status: 'locked' }
    }
  };
}

// Generate assembly summary
export function getAssemblySummary(pkg: GrantPackage): {
  total: number;
  complete: number;
  inProgress: number;
  notStarted: number;
  locked: number;
  progressByCategory: Record<string, number>;
} {
  const sections = Object.values(pkg.sections);
  
  const byCategory: Record<string, { total: number; complete: number }> = {};
  sections.forEach(s => {
    if (!byCategory[s.category]) byCategory[s.category] = { total: 0, complete: 0 };
    byCategory[s.category].total++;
    if (s.status === 'complete' || s.status === 'locked') byCategory[s.category].complete++;
  });
  
  const progressByCategory: Record<string, number> = {};
  Object.entries(byCategory).forEach(([cat, data]) => {
    progressByCategory[cat] = Math.round((data.complete / data.total) * 100);
  });
  
  return {
    total: sections.length,
    complete: sections.filter(s => s.status === 'complete').length,
    inProgress: sections.filter(s => s.status === 'in_progress').length,
    notStarted: sections.filter(s => s.status === 'not_started').length,
    locked: sections.filter(s => s.status === 'locked').length,
    progressByCategory
  };
}
