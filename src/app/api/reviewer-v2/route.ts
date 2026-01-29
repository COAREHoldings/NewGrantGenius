import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });
}

/**
 * Phase 7: Reviewer Simulation V2
 * Uses architecture_jsonb + section draft for structured simulation
 */

interface ReviewerPersona {
  name: string;
  expertise: string;
  style: string;
  focus: string[];
}

const REVIEWER_PERSONAS: ReviewerPersona[] = [
  {
    name: 'The Methodologist',
    expertise: 'Biostatistics and research design',
    style: 'Detail-oriented, questions every statistical choice',
    focus: ['statistical power', 'sample size', 'controls', 'reproducibility']
  },
  {
    name: 'The Skeptic',
    expertise: 'Senior investigator, 30+ years experience',
    style: 'Questioning, challenges assumptions, looks for gaps',
    focus: ['feasibility', 'preliminary data', 'alternative explanations', 'pitfalls']
  },
  {
    name: 'The Innovator',
    expertise: 'Technology development and translation',
    style: 'Forward-thinking, values novelty and impact',
    focus: ['innovation', 'significance', 'translational potential', 'future directions']
  },
  {
    name: 'The Clinician',
    expertise: 'Clinical research and patient outcomes',
    style: 'Practical, focused on clinical relevance',
    focus: ['clinical significance', 'patient impact', 'real-world applicability', 'ethics']
  }
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sectionContent, architectureData, personas = ['all'] } = body;

    if (!sectionContent) {
      return NextResponse.json({ error: 'Section content required' }, { status: 400 });
    }

    const selectedPersonas = personas.includes('all') 
      ? REVIEWER_PERSONAS 
      : REVIEWER_PERSONAS.filter(p => personas.includes(p.name));

    const simulations = await Promise.all(
      selectedPersonas.map(persona => simulateReview(persona, sectionContent, architectureData))
    );

    return NextResponse.json({
      simulations,
      metadata: {
        timestamp: new Date().toISOString(),
        personasUsed: selectedPersonas.map(p => p.name)
      }
    });
  } catch (error) {
    console.error('Reviewer simulation error:', error);
    return NextResponse.json({ error: 'Failed to simulate review' }, { status: 500 });
  }
}

async function simulateReview(
  persona: ReviewerPersona,
  content: string,
  architecture?: unknown
) {
  const architectureContext = architecture 
    ? `\n\nThe applicant has defined this architecture:\n${JSON.stringify(architecture, null, 2)}`
    : '';

  const systemPrompt = `You are "${persona.name}", a grant reviewer with expertise in ${persona.expertise}.
Your review style: ${persona.style}
You focus on: ${persona.focus.join(', ')}

Provide a realistic NIH study section review from this perspective. Be constructive but rigorous.

Return JSON:
{
  "overallImpression": "<1-2 sentences>",
  "score": <1-9, NIH scale where 1=exceptional>,
  "strengths": ["<strength>", ...],
  "weaknesses": ["<weakness>", ...],
  "questions": ["<question for applicant>", ...],
  "mustAddress": ["<critical issue that must be addressed>", ...]
}`;

  const userPrompt = `Review this grant section as ${persona.name}:

---
${content}
---
${architectureContext}

Provide your critique from your specific perspective and expertise.`;

  try {
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.6,
      response_format: { type: 'json_object' },
    });

    const critique = JSON.parse(response.choices[0]?.message?.content || '{}');
    
    return {
      persona: persona.name,
      expertise: persona.expertise,
      ...critique
    };
  } catch (error) {
    console.error(`Error simulating ${persona.name}:`, error);
    return {
      persona: persona.name,
      expertise: persona.expertise,
      error: 'Failed to generate review'
    };
  }
}

export async function GET() {
  return NextResponse.json({
    personas: REVIEWER_PERSONAS.map(p => ({
      name: p.name,
      expertise: p.expertise,
      focus: p.focus
    }))
  });
}
