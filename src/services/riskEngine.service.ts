/**
 * Risk Engine Service - Phase 4
 * Analyzes architecture and content for potential risks
 */

import type { ArchitectureData, DependencyMapData, RiskData } from '@/lib/schema';

export interface RiskFlag {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  aimId?: string;
  recommendation?: string;
}

export function analyzeRisks(
  architecture: ArchitectureData,
  dependencyMap: DependencyMapData,
  sectionContent?: string
): RiskData {
  const flags: RiskFlag[] = [];

  // Check architecture-based risks
  flags.push(...checkArchitectureRisks(architecture));
  
  // Check dependency-based risks
  flags.push(...checkDependencyRisks(architecture, dependencyMap));
  
  // Check content-based risks if provided
  if (sectionContent) {
    flags.push(...checkContentRisks(sectionContent, architecture));
  }

  // Determine overall risk level
  const overallRisk = calculateOverallRisk(flags);

  return {
    flags,
    overallRisk,
    lastAnalyzed: new Date().toISOString()
  };
}

function checkArchitectureRisks(arch: ArchitectureData): RiskFlag[] {
  const flags: RiskFlag[] = [];

  // No aims defined
  if (!arch.aims || arch.aims.length === 0) {
    flags.push({
      type: 'MISSING_AIMS',
      severity: 'critical',
      message: 'No specific aims defined',
      recommendation: 'Define at least 2-3 specific aims with testable hypotheses'
    });
    return flags; // Can't check more without aims
  }

  // Too many aims
  if (arch.aims.length > 4) {
    flags.push({
      type: 'TOO_MANY_AIMS',
      severity: 'medium',
      message: `${arch.aims.length} aims may be too ambitious for typical funding period`,
      recommendation: 'Consider consolidating to 2-4 focused aims'
    });
  }

  // Check each aim
  for (const aim of arch.aims) {
    // Non-falsifiable hypothesis
    if (!aim.isFalsifiable) {
      flags.push({
        type: 'NON_FALSIFIABLE',
        severity: 'high',
        message: `Aim "${aim.title || 'Untitled'}": Hypothesis marked as non-falsifiable`,
        aimId: aim.id,
        recommendation: 'Reframe hypothesis so it can be tested and potentially disproven'
      });
    }

    // No endpoints
    const validEndpoints = aim.endpoints?.filter(e => e.trim()) || [];
    if (validEndpoints.length === 0) {
      flags.push({
        type: 'MISSING_ENDPOINTS',
        severity: 'high',
        message: `Aim "${aim.title || 'Untitled'}": No measurable endpoints defined`,
        aimId: aim.id,
        recommendation: 'Define specific, measurable outcomes for this aim'
      });
    }

    // Vague hypothesis
    if (aim.hypothesis && aim.hypothesis.length < 50) {
      flags.push({
        type: 'VAGUE_HYPOTHESIS',
        severity: 'medium',
        message: `Aim "${aim.title || 'Untitled'}": Hypothesis may be too brief`,
        aimId: aim.id,
        recommendation: 'Expand hypothesis with specific predictions and mechanisms'
      });
    }
  }

  // No central hypothesis
  if (!arch.centralHypothesis || arch.centralHypothesis.length < 30) {
    flags.push({
      type: 'MISSING_CENTRAL_HYPOTHESIS',
      severity: 'high',
      message: 'Central hypothesis is missing or too brief',
      recommendation: 'Define a clear overarching hypothesis that unifies all aims'
    });
  }

  // No innovation statement
  if (!arch.innovationStatement || arch.innovationStatement.length < 20) {
    flags.push({
      type: 'MISSING_INNOVATION',
      severity: 'medium',
      message: 'Innovation statement is missing or too brief',
      recommendation: 'Clearly articulate what is novel about your approach'
    });
  }

  return flags;
}

function checkDependencyRisks(
  arch: ArchitectureData,
  deps: DependencyMapData
): RiskFlag[] {
  const flags: RiskFlag[] = [];

  if (!arch.aims || arch.aims.length < 2) return flags;
  if (!deps.dependencies || deps.dependencies.length === 0) return flags;

  // Check for domino effect (sequential dependencies where failure cascades)
  const sequentialDeps = deps.dependencies.filter(d => d.type === 'sequential');
  
  // Build dependency chain
  const aimIds = arch.aims.map(a => a.id);
  const dependencyCount: Record<string, number> = {};
  
  for (const dep of sequentialDeps) {
    dependencyCount[dep.toAimId] = (dependencyCount[dep.toAimId] || 0) + 1;
  }

  // Check for aims that many others depend on (high risk if they fail)
  for (const [aimId, count] of Object.entries(dependencyCount)) {
    if (count >= 2) {
      const aim = arch.aims.find(a => a.id === aimId);
      flags.push({
        type: 'DOMINO_DEPENDENCY',
        severity: count >= 3 ? 'high' : 'medium',
        message: `Aim "${aim?.title || 'Unknown'}": ${count} other aims depend on this sequentially`,
        aimId,
        recommendation: 'Consider adding contingency plans or parallel alternatives'
      });
    }
  }

  // Check domino risk from dependency map
  if (deps.dominoRisk && deps.dominoRisk > 0.6) {
    flags.push({
      type: 'HIGH_DOMINO_RISK',
      severity: deps.dominoRisk > 0.8 ? 'critical' : 'high',
      message: `High cascading failure risk (${Math.round(deps.dominoRisk * 100)}%)`,
      recommendation: 'Restructure aims to reduce sequential dependencies'
    });
  }

  return flags;
}

function checkContentRisks(content: string, arch: ArchitectureData): RiskFlag[] {
  const flags: RiskFlag[] = [];
  const contentLower = content.toLowerCase();

  // Check if aims mentioned in architecture are reflected in content
  if (arch.aims) {
    for (const aim of arch.aims) {
      if (aim.title) {
        const aimKeywords = aim.title.toLowerCase().split(' ')
          .filter(w => w.length > 4);
        
        const foundKeywords = aimKeywords.filter(kw => contentLower.includes(kw));
        
        if (foundKeywords.length < aimKeywords.length * 0.5) {
          flags.push({
            type: 'AIM_CONTENT_MISMATCH',
            severity: 'medium',
            message: `Aim "${aim.title}" may not be adequately addressed in content`,
            aimId: aim.id,
            recommendation: 'Ensure section content aligns with defined aims'
          });
        }
      }
    }
  }

  // Check for risk-related red flags in content
  const redFlags = [
    { pattern: /will fail|might fail|could fail/i, msg: 'Contains negative outcome language' },
    { pattern: /if time permits|time permitting/i, msg: 'Contains conditional timing language' },
    { pattern: /beyond the scope/i, msg: 'Mentions scope limitations' },
  ];

  for (const { pattern, msg } of redFlags) {
    if (pattern.test(content)) {
      flags.push({
        type: 'LANGUAGE_RED_FLAG',
        severity: 'low',
        message: msg,
        recommendation: 'Consider rephrasing to project confidence'
      });
    }
  }

  return flags;
}

function calculateOverallRisk(flags: RiskFlag[]): 'low' | 'medium' | 'high' | 'critical' {
  const criticalCount = flags.filter(f => f.severity === 'critical').length;
  const highCount = flags.filter(f => f.severity === 'high').length;
  const mediumCount = flags.filter(f => f.severity === 'medium').length;

  if (criticalCount > 0) return 'critical';
  if (highCount >= 2) return 'high';
  if (highCount >= 1 || mediumCount >= 3) return 'medium';
  return 'low';
}
