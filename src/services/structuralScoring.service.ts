/**
 * Structural Scoring Service - Phase 3
 * Computes deterministic scores based on architecture_jsonb
 */

import type { ArchitectureData, ScoreData } from '@/lib/schema';

export interface StructuralScoreBreakdown {
  completeness: number;      // 0-100: Are all fields filled?
  coherence: number;         // 0-100: Do aims connect logically?
  falsifiability: number;    // 0-100: Are hypotheses testable?
  endpointClarity: number;   // 0-100: Are endpoints well-defined?
  overall: number;           // 0-100: Weighted average
}

export function calculateStructuralScore(architecture: ArchitectureData): ScoreData {
  const breakdown = computeBreakdown(architecture);
  
  return {
    structuralScore: breakdown.overall,
    completeness: breakdown.completeness,
    coherence: breakdown.coherence,
    falsifiability: breakdown.falsifiability,
    lastCalculated: new Date().toISOString()
  };
}

function computeBreakdown(arch: ArchitectureData): StructuralScoreBreakdown {
  // Completeness: Check if essential fields are filled
  let completenessScore = 0;
  let completenessChecks = 0;

  // Central hypothesis
  completenessChecks++;
  if (arch.centralHypothesis && arch.centralHypothesis.length > 50) {
    completenessScore += 100;
  } else if (arch.centralHypothesis && arch.centralHypothesis.length > 0) {
    completenessScore += 50;
  }

  // Innovation statement
  completenessChecks++;
  if (arch.innovationStatement && arch.innovationStatement.length > 30) {
    completenessScore += 100;
  } else if (arch.innovationStatement && arch.innovationStatement.length > 0) {
    completenessScore += 50;
  }

  // Aims (should have 2-4 aims typically)
  completenessChecks++;
  const aimCount = arch.aims?.length || 0;
  if (aimCount >= 2 && aimCount <= 4) {
    completenessScore += 100;
  } else if (aimCount === 1 || aimCount === 5) {
    completenessScore += 70;
  } else if (aimCount > 0) {
    completenessScore += 40;
  }

  // Check each aim for completeness
  if (arch.aims) {
    for (const aim of arch.aims) {
      completenessChecks++;
      let aimScore = 0;
      if (aim.title && aim.title.length > 10) aimScore += 25;
      if (aim.hypothesis && aim.hypothesis.length > 30) aimScore += 25;
      if (aim.rationale && aim.rationale.length > 20) aimScore += 25;
      if (aim.endpoints && aim.endpoints.filter(e => e.trim()).length > 0) aimScore += 25;
      completenessScore += aimScore;
    }
  }

  const completeness = completenessChecks > 0 
    ? Math.round(completenessScore / completenessChecks) 
    : 0;

  // Coherence: Check logical flow between aims
  let coherenceScore = 100;
  if (arch.aims && arch.aims.length > 1) {
    // Penalize if aims don't have rationales connecting them
    const aimsWithRationale = arch.aims.filter(a => a.rationale && a.rationale.length > 20);
    coherenceScore = Math.round((aimsWithRationale.length / arch.aims.length) * 100);
  }

  // Falsifiability: Check if hypotheses are testable
  let falsifiabilityScore = 100;
  if (arch.aims && arch.aims.length > 0) {
    const falsifiableAims = arch.aims.filter(a => a.isFalsifiable);
    const aimsWithEndpoints = arch.aims.filter(
      a => a.endpoints && a.endpoints.filter(e => e.trim()).length > 0
    );
    
    const falsifiabilityRatio = falsifiableAims.length / arch.aims.length;
    const endpointRatio = aimsWithEndpoints.length / arch.aims.length;
    
    falsifiabilityScore = Math.round((falsifiabilityRatio * 50) + (endpointRatio * 50));
  }

  // Endpoint Clarity: Check quality of endpoint definitions
  let endpointClarityScore = 0;
  if (arch.aims && arch.aims.length > 0) {
    let totalEndpointScore = 0;
    let aimsWithEndpoints = 0;
    
    for (const aim of arch.aims) {
      const validEndpoints = aim.endpoints?.filter(e => e.trim().length > 10) || [];
      if (validEndpoints.length > 0) {
        aimsWithEndpoints++;
        // More endpoints = better clarity (up to 3)
        const endpointBonus = Math.min(validEndpoints.length, 3) / 3;
        // Longer endpoints = more detailed
        const avgLength = validEndpoints.reduce((sum, e) => sum + e.length, 0) / validEndpoints.length;
        const lengthBonus = Math.min(avgLength / 50, 1);
        totalEndpointScore += (endpointBonus * 50) + (lengthBonus * 50);
      }
    }
    
    endpointClarityScore = aimsWithEndpoints > 0 
      ? Math.round(totalEndpointScore / aimsWithEndpoints)
      : 0;
  }

  // Overall weighted score
  const overall = Math.round(
    (completeness * 0.35) +
    (coherence * 0.20) +
    (falsifiability * 0.25) +
    (endpointClarityScore * 0.20)
  );

  return {
    completeness,
    coherence,
    falsifiability,
    endpointClarity: endpointClarityScore,
    overall
  };
}

export function getScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 40) return 'Needs Work';
  return 'Incomplete';
}

export function getScoreColor(score: number): string {
  if (score >= 90) return 'text-green-600';
  if (score >= 75) return 'text-blue-600';
  if (score >= 60) return 'text-yellow-600';
  if (score >= 40) return 'text-orange-600';
  return 'text-red-600';
}
