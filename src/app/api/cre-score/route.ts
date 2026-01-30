import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({
    hypothesisClarity: { score: 75, reasoning: 'Demo mode' },
    novelty: { score: 70, reasoning: 'Demo mode' },
    mechanisticDepth: { score: 65, reasoning: 'Demo mode' },
    statisticalRigor: { score: 70, reasoning: 'Demo mode' },
    feasibility: { score: 80, reasoning: 'Demo mode' },
    fundingAlignment: { score: 75, reasoning: 'Demo mode' },
    overallScore: 72,
    readinessStatus: 'needs_revision',
    keyStrengths: ['Demo mode - add OpenAI key for real analysis'],
    criticalWeaknesses: ['Demo mode'],
    revisionPriorities: ['Add API key to enable full analysis']
  });
}