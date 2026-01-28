import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

function getOpenAI() { return new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' }); }

export async function POST(request: NextRequest) {
  try {
    const { unmetNeed, knowledgeGap, priorAttempts, whyNow, hypothesis, mechanism } = await request.json();

    const prompt = `You are a grant review expert. Analyze this pre-draft interrogation for a ${mechanism} grant application.

PROBLEM FRAMING:
- Unmet Need: ${unmetNeed || 'Not provided'}
- Knowledge Gap: ${knowledgeGap || 'Not provided'}
- Prior Attempts: ${priorAttempts || 'Not provided'}
- Why Now: ${whyNow || 'Not provided'}

HYPOTHESIS: ${hypothesis || 'Not provided'}

Analyze and return JSON with:
{
  "problemFramingAnalysis": {
    "score": 0-100,
    "issues": ["list of detected issues"],
    "suggestions": ["specific improvements"]
  },
  "hypothesisAnalysis": {
    "score": 0-100,
    "hasCausalStructure": boolean,
    "hasMechanisticTerminology": boolean,
    "isTestable": boolean,
    "issues": ["list of issues"],
    "suggestedRewrites": ["improved hypothesis versions"]
  },
  "fundingAlignment": {
    "score": 0-100,
    "alignmentIssues": ["any mechanism mismatches"],
    "recommendations": ["suggestions for better alignment"]
  },
  "overallReadiness": "competitive" | "needs_revision" | "high_risk"
}`;

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });

    const analysis = JSON.parse(completion.choices[0].message.content || '{}');
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Idea Lab error:', error);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
