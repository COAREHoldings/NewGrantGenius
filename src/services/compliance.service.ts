/**
 * Compliance Service - Phase 2
 * Validation and compliance checking for grant sections
 */

export interface ComplianceIssue {
  type: 'error' | 'warning';
  code: string;
  message: string;
  field?: string;
  suggestion?: string;
}

export interface ComplianceResult {
  isCompliant: boolean;
  issues: ComplianceIssue[];
  score: number; // 0-100
}

// NIH page limits by section type
const PAGE_LIMITS: Record<string, number> = {
  'specific_aims': 1,
  'research_strategy': 12,
  'significance': 4,
  'innovation': 2,
  'approach': 6,
  'bibliography': 0, // No limit
  'facilities': 0,
  'equipment': 0,
  'biosketch': 5,
  'budget_justification': 0,
};

// Required headings by section type
const REQUIRED_HEADINGS: Record<string, string[]> = {
  'specific_aims': ['Specific Aim 1', 'Specific Aim 2'],
  'research_strategy': ['Significance', 'Innovation', 'Approach'],
  'significance': ['Background', 'Significance'],
  'innovation': ['Conceptual Innovation', 'Technical Innovation', 'Application Innovation'],
  'approach': ['Preliminary Studies', 'Research Design', 'Methods', 'Timeline', 'Potential Problems'],
};

export function checkPageLimit(content: string, sectionType: string): ComplianceIssue | null {
  const limit = PAGE_LIMITS[sectionType];
  if (!limit || limit === 0) return null;

  // Rough estimate: ~3000 characters per page
  const estimatedPages = content.length / 3000;
  
  if (estimatedPages > limit) {
    return {
      type: 'error',
      code: 'PAGE_LIMIT_EXCEEDED',
      message: `Section exceeds ${limit} page limit (estimated ${estimatedPages.toFixed(1)} pages)`,
      suggestion: `Reduce content by approximately ${Math.ceil((estimatedPages - limit) * 3000)} characters`
    };
  }

  if (estimatedPages > limit * 0.95) {
    return {
      type: 'warning',
      code: 'PAGE_LIMIT_CLOSE',
      message: `Section is close to ${limit} page limit (estimated ${estimatedPages.toFixed(1)} pages)`,
      suggestion: 'Consider tightening prose to leave room for formatting adjustments'
    };
  }

  return null;
}

export function checkRequiredHeadings(content: string, sectionType: string): ComplianceIssue[] {
  const required = REQUIRED_HEADINGS[sectionType];
  if (!required) return [];

  const issues: ComplianceIssue[] = [];
  const contentLower = content.toLowerCase();

  for (const heading of required) {
    // Check for exact or similar heading presence
    const headingLower = heading.toLowerCase();
    const variants = [
      headingLower,
      headingLower.replace(' ', ': '),
      headingLower + ':',
    ];

    const found = variants.some(v => contentLower.includes(v));
    
    if (!found) {
      issues.push({
        type: 'warning',
        code: 'MISSING_HEADING',
        message: `Recommended heading "${heading}" not found`,
        field: sectionType,
        suggestion: `Consider adding a "${heading}" section`
      });
    }
  }

  return issues;
}

export function checkCommonIssues(content: string): ComplianceIssue[] {
  const issues: ComplianceIssue[] = [];

  // Check for placeholder text
  if (/\[.*?\]/.test(content) || /TODO/i.test(content) || /TBD/i.test(content)) {
    issues.push({
      type: 'error',
      code: 'PLACEHOLDER_TEXT',
      message: 'Contains placeholder text that must be replaced',
      suggestion: 'Replace all [bracketed] text, TODO, and TBD markers'
    });
  }

  // Check for missing references
  if (/\(\s*\?\s*\)/.test(content) || /\[citation needed\]/i.test(content)) {
    issues.push({
      type: 'error',
      code: 'MISSING_CITATION',
      message: 'Contains missing citation markers',
      suggestion: 'Add proper citations for all referenced claims'
    });
  }

  // Check for weak language
  const weakPhrases = ['we hope to', 'we will try to', 'we might', 'possibly', 'perhaps'];
  for (const phrase of weakPhrases) {
    if (content.toLowerCase().includes(phrase)) {
      issues.push({
        type: 'warning',
        code: 'WEAK_LANGUAGE',
        message: `Contains weak language: "${phrase}"`,
        suggestion: 'Use more confident, assertive language'
      });
      break; // Only report once
    }
  }

  // Check for excessive jargon density (rough heuristic)
  const words = content.split(/\s+/);
  const longWords = words.filter(w => w.length > 12).length;
  if (longWords / words.length > 0.15) {
    issues.push({
      type: 'warning',
      code: 'HIGH_JARGON',
      message: 'High density of complex/technical terms',
      suggestion: 'Consider simplifying language for broader reviewer audience'
    });
  }

  return issues;
}

export function validateSection(content: string, sectionType: string): ComplianceResult {
  const issues: ComplianceIssue[] = [];

  // Page limit check
  const pageLimitIssue = checkPageLimit(content, sectionType);
  if (pageLimitIssue) issues.push(pageLimitIssue);

  // Required headings
  issues.push(...checkRequiredHeadings(content, sectionType));

  // Common issues
  issues.push(...checkCommonIssues(content));

  // Calculate compliance score
  const errorCount = issues.filter(i => i.type === 'error').length;
  const warningCount = issues.filter(i => i.type === 'warning').length;
  const score = Math.max(0, 100 - (errorCount * 20) - (warningCount * 5));

  return {
    isCompliant: errorCount === 0,
    issues,
    score
  };
}
