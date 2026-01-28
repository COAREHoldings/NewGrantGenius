import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { 
      name, 
      position, 
      institution,
      eraCommons,
      education,
      personalStatement,
      projectRole,
      researchFocus,
      publications
    } = await request.json();

    if (!name || !position) {
      return NextResponse.json({ error: 'Name and position required' }, { status: 400 });
    }

    const systemPrompt = `You are an expert at writing NIH Biographical Sketches (Biosketches). 
Generate a professional NIH-format biosketch based on the provided information.

NIH Biosketch Format (5 pages max):
1. **Personal Statement** (up to 4 paragraphs) - Why you're suited for this project
2. **Positions, Scientific Appointments, and Honors** - Reverse chronological
3. **Contributions to Science** (up to 5 contributions, 4 pubs each) - Most significant work
4. **Research Support** - Active and recent completed (last 3 years)

Guidelines:
- Use third person for sections 2-4
- First person acceptable in Personal Statement
- Be specific about contributions and impact
- Highlight leadership and collaboration
- Connect experience to the proposed project
- Follow NIH formatting (no headers in Personal Statement)`;

    const userPrompt = `Generate an NIH Biosketch for:

Name: ${name}
Current Position: ${position}
Institution: ${institution || 'Not specified'}
eRA Commons ID: ${eraCommons || 'Not specified'}

Education/Training:
${education || 'Please provide education history'}

Role on Project: ${projectRole || 'Principal Investigator'}

Research Focus Areas: ${researchFocus || 'Not specified'}

Personal Statement Notes (what to emphasize):
${personalStatement || 'General qualifications for the project'}

Key Publications (to highlight):
${publications || 'Will generate placeholder examples'}

Generate a complete, NIH-compliant biosketch with all sections properly formatted.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.4,
    });

    const biosketch = response.choices[0]?.message?.content || '';

    return NextResponse.json({ biosketch });
  } catch (error) {
    console.error('Biosketch generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate biosketch' },
      { status: 500 }
    );
  }
}
