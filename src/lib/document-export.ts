// Document Export Library for Grant Master
// Handles PDF and Word document generation

export interface ExportOptions {
  format: 'pdf' | 'docx';
  includeTableOfContents: boolean;
  includePageNumbers: boolean;
  includeCoverPage: boolean;
  fontFamily?: string;
  fontSize?: number;
}

export interface GrantSection {
  id: string;
  title: string;
  content: string;
  order: number;
  wordCount?: number;
}

export interface GrantPackage {
  applicationId: string;
  title: string;
  principalInvestigator: string;
  institution: string;
  fundingAgency: string;
  sections: GrantSection[];
  createdAt: string;
  updatedAt: string;
}

// Default NIH grant section order
export const NIH_SECTION_ORDER = [
  { id: 'cover', title: 'Cover Page', order: 1 },
  { id: 'abstract', title: 'Project Summary/Abstract', order: 2 },
  { id: 'narrative', title: 'Project Narrative', order: 3 },
  { id: 'specific_aims', title: 'Specific Aims', order: 4 },
  { id: 'research_strategy', title: 'Research Strategy', order: 5 },
  { id: 'significance', title: 'Significance', order: 6 },
  { id: 'innovation', title: 'Innovation', order: 7 },
  { id: 'approach', title: 'Approach', order: 8 },
  { id: 'timeline', title: 'Timeline', order: 9 },
  { id: 'budget', title: 'Budget & Justification', order: 10 },
  { id: 'biosketch', title: 'Biographical Sketch', order: 11 },
  { id: 'facilities', title: 'Facilities & Resources', order: 12 },
  { id: 'equipment', title: 'Equipment', order: 13 },
  { id: 'human_subjects', title: 'Protection of Human Subjects', order: 14 },
  { id: 'vertebrate_animals', title: 'Vertebrate Animals', order: 15 },
  { id: 'bibliography', title: 'Bibliography & References', order: 16 },
  { id: 'letters', title: 'Letters of Support', order: 17 },
  { id: 'appendix', title: 'Appendix', order: 18 },
];

// Generate table of contents
export function generateTableOfContents(sections: GrantSection[]): string {
  let toc = '# Table of Contents\n\n';
  sections.forEach((section, index) => {
    toc += `${index + 1}. ${section.title}\n`;
  });
  return toc;
}

// Generate cover page content
export function generateCoverPage(grantPackage: GrantPackage): string {
  return `
# ${grantPackage.title}

**Principal Investigator:** ${grantPackage.principalInvestigator}

**Institution:** ${grantPackage.institution}

**Funding Agency:** ${grantPackage.fundingAgency}

**Date:** ${new Date().toLocaleDateString()}

---
`;
}

// Assemble full grant document
export function assembleGrantDocument(
  grantPackage: GrantPackage,
  options: ExportOptions
): string {
  let document = '';

  // Add cover page if requested
  if (options.includeCoverPage) {
    document += generateCoverPage(grantPackage);
    document += '\n\\newpage\n\n';
  }

  // Add table of contents if requested
  if (options.includeTableOfContents) {
    document += generateTableOfContents(grantPackage.sections);
    document += '\n\\newpage\n\n';
  }

  // Add each section
  grantPackage.sections
    .sort((a, b) => a.order - b.order)
    .forEach((section) => {
      document += `# ${section.title}\n\n`;
      document += section.content;
      document += '\n\n\\newpage\n\n';
    });

  return document;
}

// Calculate total word count
export function calculateWordCount(sections: GrantSection[]): number {
  return sections.reduce((total, section) => {
    const words = section.content.trim().split(/\s+/).length;
    return total + words;
  }, 0);
}

// Validate section limits (NIH R01 example)
export function validateSectionLimits(sections: GrantSection[]): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  const limits: Record<string, number> = {
    specific_aims: 1, // 1 page
    research_strategy: 12, // 12 pages
    biosketch: 5, // 5 pages
  };

  sections.forEach((section) => {
    if (limits[section.id]) {
      const estimatedPages = Math.ceil((section.wordCount || 0) / 500);
      if (estimatedPages > limits[section.id]) {
        warnings.push(
          `${section.title} exceeds the ${limits[section.id]} page limit (estimated ${estimatedPages} pages)`
        );
      }
    }
  });

  return {
    valid: warnings.length === 0,
    warnings,
  };
}

// Format for different export types
export function formatForExport(content: string, format: 'pdf' | 'docx'): string {
  if (format === 'pdf') {
    // Add LaTeX-style formatting hints for PDF
    return content
      .replace(/\\newpage/g, '<div style="page-break-after: always;"></div>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
  } else {
    // Keep markdown for DOCX conversion
    return content.replace(/\\newpage/g, '\n---\n');
  }
}
