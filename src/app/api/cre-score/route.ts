import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { verifyToken } from '@/lib/auth';
import { checkRateLimit, trackUsage, estimateTokens } from '@/lib/rateLimit';
import { neon } from '@neondatabase/serverless';

function getOpenAI() { return new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' }); }
const sql = neon(process.env.DATABASE_URL!);

const WEIGHTS = {
  hypothesisClarity: 0.20,
  novelty: 0.20,
  mechanisticDepth: 0.15,
  statisticalRigor: 0.15,
  feasibility: 0.15,
  fundingAlignment: 0.15
};

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const user = token ? await verifyToken(token) : null;
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit check
    const rateCheck = await checkRateLimit(user.userId);
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: rateCheck.reason, rateLimited: true }, { status: 429 });
    }

    const { title, specificAims, researchStrategy, hypothesis, mechanism, applicationId } = await request.json();

    const prompt = `You are an expert NIH grant reviewer. Score this ${mechanism} application on each domain (0-100):

TITLE: ${title}
HYPOTHESIS: ${hypothesis || 'Not explicitly stated'}
SPECIFIC AIMS: ${specificAims}
RESEARCH STRATEGY: ${researchStrategy}

Score each domain and explain:
{
  "hypothesisClarity": { "score": 0-100, "reasoning": "explanation" },
  "novelty": { "score": 0-100, "reasoning": "explanation" },
  "mechanisticDepth": { "score": 0-100, "reasoning": "explanation", "classification": "descriptive|associative|mechanistic|causal_intervention" },
  "statisticalRigor": { "score": 0-100, "reasoning": "explanation" },
  "feasibility": { "score": 0-100, "reasoning": "explanation" },
  "fundingAlignment": { "score": 0-100, "reasoning": "explanation" },
  "keyStrengths": ["list"],
  "criticalWeaknesses": ["list"],
  "revisionPriorities": ["ordered list of what to fix first"]
}`;

    const inputTokens = estimateTokens(prompt);

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });

    const outputTokens = completion.usage?.completion_tokens || estimateTokens(completion.choices[0].message.content || '');
    
    // Track usage
    await trackUsage(user.userId, 'cre-score', inputTokens, outputTokens);

    const scores = JSON.parse(completion.choices[0].message.content || '{}');
    
    // Calculate weighted overall score
    const overallScore = Math.round(
      (scores.hypothesisClarity?.score || 0) * WEIGHTS.hypothesisClarity +
      (scores.novelty?.score || 0) * WEIGHTS.novelty +
      (scores.mechanisticDepth?.score || 0) * WEIGHTS.mechanisticDepth +
      (scores.statisticalRigor?.score || 0) * WEIGHTS.statisticalRigor +
      (scores.feasibility?.score || 0) * WEIGHTS.feasibility +
      (scores.fundingAlignment?.score || 0) * WEIGHTS.fundingAlignment
    );

    let readinessStatus = 'high_risk';
    if (overallScore >= 75) readinessStatus = 'competitive';
    else if (overallScore >= 55) readinessStatus = 'needs_revision';

    // Persist score to database
    if (applicationId) {
      await sql`
        INSERT INTO cre_scores (
          application_id, hypothesis_clarity, novelty, mechanistic_depth,
          statistical_rigor, feasibility, funding_alignment, overall_score, readiness_status
        ) VALUES (
          ${applicationId},
          ${scores.hypothesisClarity?.score || 0},
          ${scores.novelty?.score || 0},
          ${scores.mechanisticDepth?.score || 0},
          ${scores.statisticalRigor?.score || 0},
          ${scores.feasibility?.score || 0},
          ${scores.fundingAlignment?.score || 0},
          ${overallScore},
          ${readinessStatus}
        )
      `;
    }

    return NextResponse.json({
      ...scores,
      overallScore,
      readinessStatus,
      weights: WEIGHTS,
      remaining: rateCheck.remaining
    });
  } catch (error) {
    console.error('CRE score error:', error);
    return NextResponse.json({ error: 'Scoring failed' }, { status: 500 });
  }
}
