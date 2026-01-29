import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sections } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { calculateStructuralScore } from '@/services/structuralScoring.service';
import { analyzeRisks } from '@/services/riskEngine.service';
import { analyzeDependencies, createDependencyMap } from '@/services/dependencyGraph.service';

/**
 * POST: Calculate and update scores/risks for a section
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sectionId = parseInt(params.id);
    
    // Get current section data
    const [section] = await db
      .select()
      .from(sections)
      .where(eq(sections.id, sectionId))
      .limit(1);

    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    const architecture = section.architectureJsonb || {};
    
    // Calculate structural score
    const scoreData = calculateStructuralScore(architecture);
    
    // Analyze dependencies
    const depAnalysis = analyzeDependencies(architecture);
    const dependencyMap = createDependencyMap(depAnalysis);
    
    // Analyze risks
    const riskData = analyzeRisks(architecture, dependencyMap, section.content || '');

    // Update section with calculated data
    await db
      .update(sections)
      .set({
        scoreJsonb: scoreData,
        dependencyMapJsonb: dependencyMap,
        riskJsonb: riskData,
        updatedAt: new Date()
      })
      .where(eq(sections.id, sectionId));

    return NextResponse.json({
      score: scoreData,
      dependencies: dependencyMap,
      risk: riskData,
      recommendations: depAnalysis.recommendations
    });
  } catch (error) {
    console.error('Error calculating scores:', error);
    return NextResponse.json({ error: 'Failed to calculate scores' }, { status: 500 });
  }
}
