import { NextRequest, NextResponse } from 'next/server';

interface LetterRequest {
  type: 'support' | 'consultant' | 'vendor';
  recipientName: string;
  recipientTitle: string;
  recipientInstitution: string;
  projectTitle: string;
  piName: string;
  piInstitution: string;
  grantMechanism: string;
  collaborationDetails?: string;
  consultantExpertise?: string;
  consultantRole?: string;
  consultantEffort?: string;
  consultantRate?: number;
  vendorProduct?: string;
  vendorCommitment?: string;
  customParagraphs?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const data: LetterRequest = await request.json();
    
    let letter = '';
    
    switch (data.type) {
      case 'support':
        letter = generateSupportLetter(data);
        break;
      case 'consultant':
        letter = generateConsultantLetter(data);
        break;
      case 'vendor':
        letter = generateVendorLetter(data);
        break;
      default:
        return NextResponse.json({ error: 'Invalid letter type' }, { status: 400 });
    }
    
    return NextResponse.json({ letter, type: data.type });
  } catch (error) {
    console.error('Letter generation error:', error);
    return NextResponse.json({ error: 'Letter generation failed' }, { status: 500 });
  }
}

function generateSupportLetter(data: LetterRequest): string {
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  
  return `${data.recipientInstitution}
${data.recipientTitle ? data.recipientTitle + '\n' : ''}

${date}

RE: Letter of Support for "${data.projectTitle}"
${data.grantMechanism} Application

Dear Review Committee,

I am writing to express my strong support for the ${data.grantMechanism} application entitled "${data.projectTitle}" submitted by ${data.piName} at ${data.piInstitution}.

${data.collaborationDetails || `Our institution has an established collaborative relationship with ${data.piName}'s research team. We have worked together on projects of mutual scientific interest and have found these collaborations to be highly productive and beneficial to both parties.`}

${data.piName}'s research program addresses an important area of unmet need, and this proposed project has significant potential for impact. The research team has the expertise and resources necessary to successfully execute the proposed aims.

${data.customParagraphs?.join('\n\n') || ''}

We are committed to supporting this project and look forward to a productive collaboration. Please do not hesitate to contact me if you require any additional information.

Sincerely,

${data.recipientName}
${data.recipientTitle}
${data.recipientInstitution}`;
}

function generateConsultantLetter(data: LetterRequest): string {
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  
  const effortText = data.consultantEffort || '5% annual effort';
  const rateText = data.consultantRate ? `at a rate of $${data.consultantRate}/day` : '';
  
  return `${data.recipientInstitution}
${data.recipientTitle}

${date}

RE: Consultant Commitment Letter for "${data.projectTitle}"
${data.grantMechanism} Application

Dear Review Committee,

I am writing to confirm my commitment to serve as a consultant on the ${data.grantMechanism} application entitled "${data.projectTitle}" submitted by ${data.piName} at ${data.piInstitution}.

EXPERTISE AND ROLE:
${data.consultantExpertise || 'I bring specialized expertise relevant to this project that will complement the research team\'s capabilities.'}

${data.consultantRole || 'As a consultant, I will provide expert guidance, review experimental designs, participate in data interpretation, and contribute to manuscript preparation as needed.'}

COMMITMENT:
I commit to providing ${effortText} ${rateText} to support this project. This level of effort is appropriate given the scope of my consultative role and will ensure timely and meaningful contributions to the project's success.

QUALIFICATIONS:
My background and experience make me well-suited to contribute to this project. I have extensive experience in the relevant scientific domain and have previously collaborated successfully with academic research teams.

${data.customParagraphs?.join('\n\n') || ''}

I am enthusiastic about the opportunity to contribute to this important research and am confident in the project's potential for success. Please contact me if you require any additional information.

Sincerely,

${data.recipientName}
${data.recipientTitle}
${data.recipientInstitution}`;
}

function generateVendorLetter(data: LetterRequest): string {
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  
  return `${data.recipientInstitution}

${date}

RE: Vendor Commitment Letter for "${data.projectTitle}"
${data.grantMechanism} Application

To Whom It May Concern,

This letter confirms that ${data.recipientInstitution} is prepared to provide products/services in support of the ${data.grantMechanism} application entitled "${data.projectTitle}" submitted by ${data.piName} at ${data.piInstitution}.

PRODUCT/SERVICE COMMITMENT:
${data.vendorProduct || 'We will provide the specialized products and/or services required for this research project.'}

${data.vendorCommitment || 'We confirm our ability to meet the timeline and specifications outlined in the grant application. Our company has the capacity and resources to fulfill this commitment throughout the project period.'}

PRICING:
Pricing for the committed products/services will be consistent with our standard institutional/government rates and as specified in the budget of the grant application.

TECHNICAL SUPPORT:
We will provide appropriate technical support to ensure successful implementation and use of our products/services within the scope of this project.

${data.customParagraphs?.join('\n\n') || ''}

We look forward to supporting this important research. Please contact me directly if you require any additional information or documentation.

Sincerely,

${data.recipientName}
${data.recipientTitle}
${data.recipientInstitution}`;
}

export async function GET() {
  return NextResponse.json({
    letterTypes: ['support', 'consultant', 'vendor'],
    requiredFields: {
      all: ['type', 'recipientName', 'recipientInstitution', 'projectTitle', 'piName', 'piInstitution', 'grantMechanism'],
      consultant: ['consultantExpertise', 'consultantRole', 'consultantEffort'],
      vendor: ['vendorProduct', 'vendorCommitment']
    }
  });
}
