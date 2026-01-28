import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

function getOpenAI() { return new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' }); }

const ATTACHMENT_PROMPTS: Record<string, string> = {
  'Project Summary/Abstract': `Write a 30-line Project Summary/Abstract for an NIH grant application. Include:
- Relevance to public health (first sentence)
- Project objectives and specific aims
- Methods to be employed
- Expected outcomes and impact
Keep it concise, no proprietary information, suitable for public release.`,

  'Project Narrative': `Write a 2-3 sentence Project Narrative explaining the relevance of this research to public health. 
This should be in plain language that the general public can understand.`,

  'Facilities & Other Resources': `Draft a Facilities & Other Resources document describing:
- Laboratory space and equipment
- Office space and computing resources  
- Core facilities available
- Collaborative resources
- Animal facilities (if applicable)
- Clinical resources (if applicable)
Format with clear section headers.`,

  'Equipment': `Draft an Equipment section listing major equipment available for this project. Include:
- Equipment name and model
- Relevant specifications
- Location
- Availability
Format as a clear list.`,

  'Budget Justification': `Draft a Budget Justification narrative covering:
- Personnel (roles, effort, responsibilities)
- Equipment (if any)
- Supplies (categories and rationale)
- Consultant costs (if any)
- Other expenses
- Indirect costs
Explain why each cost is necessary for the project.`,

  'Authentication of Key Resources': `Draft an Authentication of Key Resources document identifying:
- Key biological/chemical resources
- Authentication methods and standards
- Quality control measures
- Sources and validation approaches`,

  'Data Management Plan': `Draft a Data Management Plan covering:
- Types of data to be generated
- Data standards and formats
- Data sharing policies and timeline
- Data preservation and archiving
- Access and security measures`,

  'Commercialization Plan': `Draft a Commercialization Plan covering:
- Market analysis and opportunity
- Competitive landscape
- Target customers
- Business model
- Intellectual property strategy
- Commercialization milestones
- Team qualifications for commercialization`,

  'Commercialization Strategy': `Draft a Commercialization Strategy covering:
- Dual-use potential (military and civilian)
- Market size and opportunity
- Competitive advantages
- Path to market
- Partnership strategy
- Revenue model`,
};

export async function POST(request: NextRequest) {
  try {
    const { attachmentName, title, specificAims, researchStrategy, mechanism } = await request.json();

    if (!attachmentName) {
      return NextResponse.json({ error: 'Attachment name required' }, { status: 400 });
    }

    const basePrompt = ATTACHMENT_PROMPTS[attachmentName] || 
      `Draft a ${attachmentName} document for a grant application. Make it professional and complete.`;

    const systemPrompt = `You are an expert grant writer with extensive experience in NIH, NSF, and DoD grant applications.
Your task is to draft high-quality grant attachment documents based on the application content provided.

Guidelines:
- Follow agency-specific formatting requirements
- Be specific and detailed, avoid vague statements
- Use professional scientific language
- Include all required elements for the document type
- Format with clear headers and structure`;

    const userPrompt = `${basePrompt}

Grant Information:
- Mechanism: ${mechanism || 'NIH SBIR'}
- Title: ${title || 'Not provided'}

Specific Aims:
${specificAims || 'Not yet written'}

Research Strategy Summary:
${researchStrategy ? researchStrategy.substring(0, 4000) : 'Not yet written'}

Generate a complete, ready-to-use ${attachmentName} document.`;

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.4,
    });

    const draft = response.choices[0]?.message?.content || '';

    return NextResponse.json({ draft });
  } catch (error) {
    console.error('Attachment draft error:', error);
    return NextResponse.json(
      { error: 'Failed to generate draft' },
      { status: 500 }
    );
  }
}
