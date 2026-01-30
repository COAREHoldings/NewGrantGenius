import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({
    criterionScores: { significance: 5, innovation: 5, approach: 5, investigators: 5, environment: 5 },
    strengths: ['Demo mode - submit application for real review'],
    weaknesses: ['Demo mode'],
    fatalFlaws: [],
    overallImpactScore: 5,
    fundingTier: 'Competitive',
    detailedFeedback: []
  });
}