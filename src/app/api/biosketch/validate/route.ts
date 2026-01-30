import { NextRequest, NextResponse } from 'next/server';

// NIH Biosketch format validation rules
const NIH_BIOSKETCH_RULES = {
  maxPages: 5,
  requiredSections: [
    'Personal Statement',
    'Positions, Scientific Appointments, and Honors',
    'Contribution to Science',
    'Research Support'
  ],
  alternativeSectionNames: {
    'Personal Statement': ['personal statement', 'statement'],
    'Positions, Scientific Appointments, and Honors': ['positions', 'appointments', 'honors', 'education'],
    'Contribution to Science': ['contribution', 'contributions to science', 'scientific contributions'],
    'Research Support': ['research support', 'scholastic performance', 'ongoing research', 'completed research']
  },
  margins: '0.5 inch minimum',
  fonts: ['Arial', 'Georgia', 'Helvetica', 'Palatino'],
  minFontSize: 11
};

// Estimate page count from text (rough estimate: ~3000 chars per page)
function estimatePageCount(text: string): number {
  const charsPerPage = 3000;
  return Math.ceil(text.length / charsPerPage);
}

// Check for required sections in text
function checkSections(text: string): { found: string[]; missing: string[] } {
  const lowerText = text.toLowerCase();
  const found: string[] = [];
  const missing: string[] = [];

  for (const section of NIH_BIOSKETCH_RULES.requiredSections) {
    const alternatives = NIH_BIOSKETCH_RULES.alternativeSectionNames[section as keyof typeof NIH_BIOSKETCH_RULES.alternativeSectionNames] || [section.toLowerCase()];
    const isFound = alternatives.some(alt => lowerText.includes(alt.toLowerCase()));
    
    if (isFound) {
      found.push(section);
    } else {
      missing.push(section);
    }
  }

  return { found, missing };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const memberName = formData.get('memberName') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const issues: string[] = [];
    const warnings: string[] = [];
    const passed: string[] = [];
    let extractedText = '';

    // Check file type
    const fileName = file.name.toLowerCase();
    const isPDF = fileName.endsWith('.pdf');
    const isDoc = fileName.endsWith('.doc') || fileName.endsWith('.docx');

    if (!isPDF && !isDoc) {
      issues.push('File must be PDF or Word document (.pdf, .doc, .docx)');
    }

    // Check file size (should be reasonable for 5 pages)
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > 10) {
      warnings.push(`File is ${fileSizeMB.toFixed(1)}MB - unusually large for a 5-page biosketch`);
    } else {
      passed.push('File size is reasonable');
    }

    // Try to parse PDF content
    if (isPDF) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // Dynamic import for pdf-parse
        const pdfParse = (await import('pdf-parse')).default;
        const pdfData = await pdfParse(buffer);
        
        extractedText = pdfData.text;
        const pageCount = pdfData.numpages;

        // Check page count
        if (pageCount > NIH_BIOSKETCH_RULES.maxPages) {
          issues.push(`Document has ${pageCount} pages - NIH limit is ${NIH_BIOSKETCH_RULES.maxPages} pages`);
        } else {
          passed.push(`Page count OK (${pageCount}/${NIH_BIOSKETCH_RULES.maxPages} pages)`);
        }

        // Check for required sections
        const { found, missing } = checkSections(extractedText);
        
        if (found.length > 0) {
          passed.push(`Found sections: ${found.join(', ')}`);
        }
        
        if (missing.length > 0) {
          issues.push(`Missing or unclear sections: ${missing.join(', ')}`);
        }

        // Check for ORCID
        if (extractedText.toLowerCase().includes('orcid') || /\d{4}-\d{4}-\d{4}-\d{4}/.test(extractedText)) {
          passed.push('ORCID identifier found');
        } else {
          warnings.push('No ORCID identifier found - recommended by NIH');
        }

        // Check for eRA Commons ID
        if (extractedText.toLowerCase().includes('era commons') || extractedText.toLowerCase().includes('commons id')) {
          passed.push('eRA Commons reference found');
        }

      } catch (pdfError) {
        console.error('PDF parsing error:', pdfError);
        warnings.push('Could not fully parse PDF content - manual review recommended');
      }
    } else if (isDoc) {
      warnings.push('Word documents cannot be fully validated - convert to PDF for complete analysis');
    }

    // Determine overall status
    let status: 'valid' | 'needs_fixes' | 'needs_review' = 'valid';
    if (issues.length > 0) {
      status = 'needs_fixes';
    } else if (warnings.length > 0) {
      status = 'needs_review';
    }

    const validation = {
      fileName: file.name,
      fileSize: file.size,
      fileSizeMB: fileSizeMB.toFixed(2),
      memberName: memberName || 'Unknown',
      status,
      issues,
      warnings,
      passed,
      guidelines: NIH_BIOSKETCH_RULES,
      recommendations: issues.length > 0 || warnings.length > 0 ? [
        ...(issues.some(i => i.includes('pages')) ? ['Reduce document to 5 pages or less'] : []),
        ...(issues.some(i => i.includes('Missing')) ? ['Add all 4 required sections in order'] : []),
        'Use 11pt Arial, Helvetica, Palatino, or Georgia font',
        'Maintain 0.5 inch margins minimum',
        'Consider using SciENcv for proper NIH formatting'
      ] : [],
      resources: {
        nihTemplate: 'https://grants.nih.gov/grants/forms/biosketch.htm',
        sciencv: 'https://www.ncbi.nlm.nih.gov/sciencv/',
        samples: 'https://grants.nih.gov/grants/forms/biosketch-sample.htm'
      }
    };

    return NextResponse.json(validation);
  } catch (error) {
    console.error('Error validating biosketch:', error);
    return NextResponse.json({ error: 'Failed to validate biosketch' }, { status: 500 });
  }
}

// GET endpoint to return format requirements
export async function GET() {
  return NextResponse.json({
    requirements: NIH_BIOSKETCH_RULES,
    sections: [
      {
        name: 'Personal Statement',
        description: 'Briefly describe why you are well-suited for this project. Include relevant expertise, accomplishments, and how they relate to the proposed work.',
        maxLength: 'No specific limit, but be concise'
      },
      {
        name: 'Positions, Scientific Appointments, and Honors',
        description: 'List positions and honors in reverse chronological order. Include employment history, professional memberships, and honors.',
        maxLength: 'No specific limit'
      },
      {
        name: 'Contribution to Science',
        description: 'Describe up to 5 contributions to science. For each, provide a brief description and list up to 4 publications.',
        maxLength: 'Up to 5 contributions, 4 citations each (20 total)'
      },
      {
        name: 'Research Support and/or Scholastic Performance',
        description: 'List ongoing and completed research projects (last 3 years). Include project title, role, and funding source.',
        maxLength: 'No specific limit'
      }
    ],
    resources: {
      nihInstructions: 'https://grants.nih.gov/grants/forms/biosketch.htm',
      sciencv: 'https://www.ncbi.nlm.nih.gov/sciencv/',
      sampleBiosketches: 'https://grants.nih.gov/grants/forms/biosketch-sample.htm'
    }
  });
}
