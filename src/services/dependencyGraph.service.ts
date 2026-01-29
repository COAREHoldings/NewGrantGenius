/**
 * Dependency Graph Service - Phase 5
 * Detects domino aims and manages dependency relationships
 */

import type { ArchitectureData, DependencyMapData } from '@/lib/schema';

export interface DependencyEdge {
  fromAimId: string;
  toAimId: string;
  type: 'sequential' | 'parallel' | 'conditional';
  description?: string;
  weight?: number; // 0-1, how critical is this dependency
}

export interface DependencyAnalysis {
  dependencies: DependencyEdge[];
  dominoRisk: number;
  criticalPath: string[];
  independentAims: string[];
  recommendations: string[];
}

/**
 * Analyze aim dependencies and compute domino risk
 */
export function analyzeDependencies(architecture: ArchitectureData): DependencyAnalysis {
  const aims = architecture.aims || [];
  
  if (aims.length < 2) {
    return {
      dependencies: [],
      dominoRisk: 0,
      criticalPath: [],
      independentAims: aims.map(a => a.id),
      recommendations: []
    };
  }

  // Infer dependencies from rationale and hypothesis text
  const dependencies = inferDependencies(aims);
  
  // Calculate domino risk
  const dominoRisk = calculateDominoRisk(aims, dependencies);
  
  // Find critical path (longest dependency chain)
  const criticalPath = findCriticalPath(aims, dependencies);
  
  // Find independent aims (no dependencies)
  const dependentAimIds = new Set(dependencies.map(d => d.toAimId));
  const independentAims = aims
    .filter(a => !dependentAimIds.has(a.id))
    .map(a => a.id);
  
  // Generate recommendations
  const recommendations = generateRecommendations(aims, dependencies, dominoRisk);

  return {
    dependencies,
    dominoRisk,
    criticalPath,
    independentAims,
    recommendations
  };
}

function inferDependencies(aims: ArchitectureData['aims']): DependencyEdge[] {
  if (!aims) return [];
  
  const dependencies: DependencyEdge[] = [];
  
  // Look for dependency keywords in rationale
  const dependencyKeywords = [
    'based on', 'depends on', 'builds upon', 'requires', 'following',
    'after', 'once', 'upon completion', 'results from', 'informed by'
  ];
  
  for (let i = 0; i < aims.length; i++) {
    const aim = aims[i];
    const rationale = (aim.rationale || '').toLowerCase();
    const hypothesis = (aim.hypothesis || '').toLowerCase();
    const text = rationale + ' ' + hypothesis;
    
    // Check if this aim references other aims
    for (let j = 0; j < aims.length; j++) {
      if (i === j) continue;
      
      const otherAim = aims[j];
      const otherTitle = (otherAim.title || '').toLowerCase();
      const otherKeywords = otherTitle.split(' ').filter(w => w.length > 4);
      
      // Check for direct reference
      const referencesOther = otherKeywords.some(kw => text.includes(kw));
      
      // Check for dependency keywords
      const hasDependencyKeyword = dependencyKeywords.some(kw => text.includes(kw));
      
      if (referencesOther && hasDependencyKeyword) {
        dependencies.push({
          fromAimId: otherAim.id,
          toAimId: aim.id,
          type: 'sequential',
          description: `${aim.title} appears to depend on ${otherAim.title}`,
          weight: 0.7
        });
      }
    }
  }
  
  // If aims are numbered (Aim 1, Aim 2, etc.), assume sequential dependency
  const numberedAims = aims.filter(a => /aim\s*\d/i.test(a.title || ''));
  if (numberedAims.length === aims.length && dependencies.length === 0) {
    // All aims are numbered, assume weak sequential dependency
    for (let i = 1; i < aims.length; i++) {
      dependencies.push({
        fromAimId: aims[i - 1].id,
        toAimId: aims[i].id,
        type: 'sequential',
        description: 'Inferred from aim numbering',
        weight: 0.3
      });
    }
  }
  
  return dependencies;
}

function calculateDominoRisk(
  aims: ArchitectureData['aims'],
  dependencies: DependencyEdge[]
): number {
  if (!aims || aims.length < 2) return 0;
  if (dependencies.length === 0) return 0;
  
  // Count incoming dependencies per aim
  const incomingCount: Record<string, number> = {};
  for (const dep of dependencies) {
    incomingCount[dep.toAimId] = (incomingCount[dep.toAimId] || 0) + 1;
  }
  
  // Calculate maximum chain length
  const chainLength = findLongestChain(aims, dependencies);
  
  // Risk factors:
  // 1. Ratio of sequential dependencies
  const sequentialRatio = dependencies.filter(d => d.type === 'sequential').length / dependencies.length;
  
  // 2. Chain length relative to total aims
  const chainRatio = chainLength / aims.length;
  
  // 3. Concentration of dependencies (some aims have many dependents)
  const maxDependents = Math.max(...Object.values(incomingCount), 0);
  const concentrationRatio = maxDependents / (aims.length - 1);
  
  // Weighted risk calculation
  const risk = (sequentialRatio * 0.3) + (chainRatio * 0.4) + (concentrationRatio * 0.3);
  
  return Math.min(risk, 1);
}

function findLongestChain(
  aims: ArchitectureData['aims'],
  dependencies: DependencyEdge[]
): number {
  if (!aims || aims.length === 0) return 0;
  
  // Build adjacency list
  const adj: Record<string, string[]> = {};
  for (const aim of aims) {
    adj[aim.id] = [];
  }
  for (const dep of dependencies) {
    if (dep.type === 'sequential') {
      adj[dep.fromAimId]?.push(dep.toAimId);
    }
  }
  
  // DFS to find longest path
  const visited = new Set<string>();
  let maxLength = 0;
  
  function dfs(aimId: string, length: number): void {
    maxLength = Math.max(maxLength, length);
    
    for (const nextId of adj[aimId] || []) {
      if (!visited.has(nextId)) {
        visited.add(nextId);
        dfs(nextId, length + 1);
        visited.delete(nextId);
      }
    }
  }
  
  for (const aim of aims) {
    visited.clear();
    visited.add(aim.id);
    dfs(aim.id, 1);
  }
  
  return maxLength;
}

function findCriticalPath(
  aims: ArchitectureData['aims'],
  dependencies: DependencyEdge[]
): string[] {
  if (!aims || aims.length === 0) return [];
  
  // Build adjacency list
  const adj: Record<string, string[]> = {};
  for (const aim of aims) {
    adj[aim.id] = [];
  }
  for (const dep of dependencies) {
    if (dep.type === 'sequential') {
      adj[dep.fromAimId]?.push(dep.toAimId);
    }
  }
  
  // Find longest path using DFS
  let longestPath: string[] = [];
  
  function dfs(aimId: string, path: string[]): void {
    if (path.length > longestPath.length) {
      longestPath = [...path];
    }
    
    for (const nextId of adj[aimId] || []) {
      if (!path.includes(nextId)) {
        dfs(nextId, [...path, nextId]);
      }
    }
  }
  
  for (const aim of aims) {
    dfs(aim.id, [aim.id]);
  }
  
  return longestPath;
}

function generateRecommendations(
  aims: ArchitectureData['aims'],
  dependencies: DependencyEdge[],
  dominoRisk: number
): string[] {
  const recommendations: string[] = [];
  
  if (!aims || aims.length === 0) {
    recommendations.push('Define specific aims to enable dependency analysis');
    return recommendations;
  }
  
  if (dominoRisk > 0.7) {
    recommendations.push('High domino risk detected. Consider restructuring aims to reduce sequential dependencies.');
    recommendations.push('Add contingency plans for critical aims that others depend on.');
  }
  
  if (dominoRisk > 0.5) {
    recommendations.push('Consider making some aims parallel rather than sequential.');
  }
  
  // Check for aims with no dependencies (good) vs all sequential (risky)
  const sequentialDeps = dependencies.filter(d => d.type === 'sequential');
  if (sequentialDeps.length === dependencies.length && dependencies.length > 2) {
    recommendations.push('All aims are sequentially dependent. Consider if some can proceed in parallel.');
  }
  
  // Check for single point of failure
  const dependentCounts: Record<string, number> = {};
  for (const dep of dependencies) {
    dependentCounts[dep.fromAimId] = (dependentCounts[dep.fromAimId] || 0) + 1;
  }
  
  const criticalAims = Object.entries(dependentCounts)
    .filter(([_, count]) => count >= 2)
    .map(([id]) => aims.find(a => a.id === id)?.title || id);
  
  if (criticalAims.length > 0) {
    recommendations.push(`Critical aims with multiple dependents: ${criticalAims.join(', ')}. Ensure robust preliminary data supports these.`);
  }
  
  return recommendations;
}

/**
 * Update dependency map in database format
 */
export function createDependencyMap(analysis: DependencyAnalysis): DependencyMapData {
  return {
    dependencies: analysis.dependencies,
    dominoRisk: analysis.dominoRisk
  };
}
