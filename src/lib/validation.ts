import { MECHANISMS } from './mechanisms';

export interface ValidationError {
  type: 'error' | 'warning';
  section?: string;
  message: string;
}

export interface SectionForValidation {
  title: string;
  content: string | null;
  page_limit: number;
  page_count: number | null;
  required_headings: string[] | null;
}

export function validateSection(section: SectionForValidation): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Check page limit
  if (section.page_count && section.page_count > section.page_limit) {
    errors.push({
      type: 'error',
      section: section.title,
      message: `Page limit exceeded: ${section.page_count}/${section.page_limit} pages`
    });
  }
  
  // Check required headings
  if (section.required_headings && section.content) {
    const content = section.content.toLowerCase();
    for (const heading of section.required_headings) {
      if (!content.includes(heading.toLowerCase())) {
        errors.push({
          type: 'error',
          section: section.title,
          message: `Missing required heading: ${heading}`
        });
      }
    }
  }
  
  // Check if section is empty
  if (!section.content || section.content.trim().length === 0) {
    errors.push({
      type: 'warning',
      section: section.title,
      message: 'Section is empty'
    });
  }
  
  return errors;
}

export function validateApplication(
  mechanism: string,
  sections: SectionForValidation[],
  attachments: { name: string; status: string; required: boolean }[]
): ValidationError[] {
  const errors: ValidationError[] = [];
  const mechanismConfig = MECHANISMS[mechanism];
  
  if (!mechanismConfig) {
    errors.push({ type: 'error', message: 'Invalid mechanism selected' });
    return errors;
  }
  
  // Validate all sections
  for (const section of sections) {
    errors.push(...validateSection(section));
  }
  
  // Check required attachments
  const requiredAttachments = mechanismConfig.attachments.filter(a => a.required);
  for (const reqAttachment of requiredAttachments) {
    const found = attachments.find(a => a.name === reqAttachment.name);
    if (!found || found.status !== 'uploaded') {
      errors.push({
        type: 'error',
        message: `Required attachment missing: ${reqAttachment.name}`
      });
    }
  }
  
  return errors;
}

export function canExport(errors: ValidationError[]): boolean {
  return !errors.some(e => e.type === 'error');
}

export function estimatePageCount(content: string): number {
  if (!content) return 0;
  const charsPerPage = 3000;
  return Math.ceil(content.length / charsPerPage);
}
