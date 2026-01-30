import { NextRequest, NextResponse } from 'next/server';

// NIH Biosketch format validation rules
const NIH_BIOSKETCH_RULES = {
  maxPages: 5,
  requiredSections: [
    'Personal Statement',
    'Positions, Scientific Appointments, and Honors',
    'Contribution to Science',
    'Research Support and/or Scholastic Performance'
  ],
  margins: '0.5 inch minimum',
  font: 'Arial, Georgia, Helvetica, Palatino Linotype - 11pt minimum',
  lineSpacing: 'Single-spaced acceptable'
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const memberName = formData.get('memberName') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // In a production system, this would:
    // 1. Parse the PDF/DOCX
    // 2. Check against NIH format requirements
    // 3. Return specific issues found
    
    // For now, return format guidelines and recommendations
    const validation = {
      fileName: file.name,
      fileSize: file.size,
      memberName: memberName || 'Unknown',
      status: 'needs_review',
      guidelines: NIH_BIOSKETCH_RULES,
      recommendations: [
        'Ensure document is 5 pages or less',
        'Include all 4 required sections in order',
        'Use 11pt Arial, Helvetica, Palatino, or Georgia font',
        'Maintain 0.5 inch margins minimum',
        'Personal Statement should describe your qualifications for this specific project',
        'List up to 5 contributions to science with citations',
        'Include current and recently completed research support'
      ],
      nihTemplate: 'https://grants.nih.gov/grants/forms/biosketch.htm',
      scienceExpertsFormat: 'https://www.ncbi.nlm.nih.gov/sciencv/'
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
      scienceExperts: 'https://www.ncbi.nlm.nih.gov/sciencv/',
      sampleBiosketches: 'https://grants.nih.gov/grants/forms/biosketch-sample.htm'
    }
  });
}
