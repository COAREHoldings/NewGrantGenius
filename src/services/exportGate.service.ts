/**
 * Export Gate Service - Phase 6 & 8
 * Soft warnings (Phase 6) and hard blocking (Phase 8) for export
 */

import type { ArchitectureData, ScoreData, RiskData, DependencyMapData } from '@/lib/schema';

export interface ExportGateResult {
  canExport: boolean;
  warnings: string[];
  blockers: string[];
  requiresOverride: boolean;
}

export interface ExportGateOptions {
  hardGateEnabled?: boolean;
  adminOverride?: boolean;
  minimumScore?: number;
}

const DEFAULT_OPTIONS: ExportGateOptions = {
  hardGateEnabled: false, // Phase 6: soft warnings only
  adminOverride: false,
  minimumScore: 50
};

/**
 * Check if application is ready for export
 */
export function checkExportGate(
  architecture: ArchitectureData | null,
  score: ScoreData | null,
  risk: RiskData | null,
  dependencyMap: DependencyMapData | null,
  options: ExportGateOptions = DEFAULT_OPTIONS
): ExportGateResult {
  const warnings: string[] = [];
  const blockers: string[] = [];
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Check architecture completeness
  if (!architecture || !architecture.aims || architecture.aims.length === 0) {
    const msg = 'Architecture not defined - aims and hypotheses not specified';
    opts.hardGateEnabled ? blockers.push(msg) : warnings.push(msg);
  } else {
    // Check for missing central hypothesis
    if (!architecture.centralHypothesis) {
      const msg = 'Central hypothesis not defined';
      opts.hardGateEnabled ? blockers.push(msg) : warnings.push(msg);
    }

    // Check for non-falsifiable hypotheses
    const nonFalsifiable = architecture.aims.filter(a => !a.isFalsifiable);
    if (nonFalsifiable.length > 0) {
      const msg = `${nonFalsifiable.length} aim(s) have non-falsifiable hypotheses`;
      opts.hardGateEnabled ? blockers.push(msg) : warnings.push(msg);
    }

    // Check for missing endpoints
    const missingEndpoints = architecture.aims.filter(
      a => !a.endpoints || a.endpoints.filter(e => e.trim()).length === 0
    );
    if (missingEndpoints.length > 0) {
      const msg = `${missingEndpoints.length} aim(s) missing defined endpoints`;
      opts.hardGateEnabled ? blockers.push(msg) : warnings.push(msg);
    }
  }

  // Check structural score
  if (score?.structuralScore !== undefined) {
    if (score.structuralScore < opts.minimumScore!) {
      const msg = `Structural score (${score.structuralScore}) below minimum (${opts.minimumScore})`;
      opts.hardGateEnabled ? blockers.push(msg) : warnings.push(msg);
    }
  } else {
    warnings.push('Structural score not calculated');
  }

  // Check risk level
  if (risk?.overallRisk) {
    if (risk.overallRisk === 'critical') {
      const msg = 'Critical risk level detected';
      opts.hardGateEnabled ? blockers.push(msg) : warnings.push(msg);
    } else if (risk.overallRisk === 'high' && opts.hardGateEnabled) {
      warnings.push('High risk level - review risks before submission');
    }
  }

  // Check domino dependency risk
  if (dependencyMap?.dominoRisk && dependencyMap.dominoRisk > 0.7) {
    const msg = `High domino dependency risk (${Math.round(dependencyMap.dominoRisk * 100)}%)`;
    opts.hardGateEnabled && dependencyMap.dominoRisk > 0.8 
      ? blockers.push(msg) 
      : warnings.push(msg);
  }

  // Determine if export is allowed
  const canExport = opts.adminOverride || blockers.length === 0;
  const requiresOverride = blockers.length > 0 && !opts.adminOverride;

  return {
    canExport,
    warnings,
    blockers,
    requiresOverride
  };
}

/**
 * Generate export gate banner message
 */
export function getExportBannerMessage(result: ExportGateResult): {
  type: 'info' | 'warning' | 'error';
  message: string;
} | null {
  if (result.blockers.length > 0) {
    return {
      type: 'error',
      message: `Export blocked: ${result.blockers[0]}${result.blockers.length > 1 ? ` (+${result.blockers.length - 1} more issues)` : ''}`
    };
  }

  if (result.warnings.length > 0) {
    return {
      type: 'warning',
      message: `${result.warnings.length} issue(s) detected. Review Architecture tab before export.`
    };
  }

  return null;
}
