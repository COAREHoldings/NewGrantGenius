import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

function getOpenAI() { return new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' }); }

export async function POST(request: NextRequest) {
  try {
    const { specificAims, researchStrategy, timeline, budget } = await request.json();

    const prompt = `Analyze scope and feasibility for this grant application. Return JSON:

SPECIFIC AIMS:
${specificAims}

RESEARCH STRATEGY:
${researchStrategy}

TIMELINE: ${timeline || 'Not specified'}
BUDGET: ${budget || 'Not specified'}

Analyze for:
1. Overloaded aims (too many objectives per aim)
2. Interdependent aims without contingency plans
3. Unrealistic timelines
4. Resource/expertise feasibility

Return:
{
  "overallFeasibilityScore": 0-100,
  "scopeIssues": [
    { "type": "overloaded" | "interdependent" | "timeline" | "resource", "description": "...", "severity": "high" | "medium" | "low" }
  ],
  "aimAnalysis": [
    { "aimNumber": 1, "complexity": "appropriate" | "overloaded", "dependencies": ["list of dependencies"], "contingencyNeeded": boolean }
  ],
  "timelineAssessment": { "realistic": boolean, "concerns": ["..."] },
  "recommendations": ["specific suggestions"],
  "reviewerConcerns": ["what reviewers might flag"]
}`;

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });

    const analysis = JSON.parse(completion.choices[0].message.content || '{}');
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Feasibility error:', error);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
