// Version Control System for Grant Documents

export interface ContentVersion {
  id: string;
  timestamp: string;
  content: string;
  source: 'user' | 'ai-generated' | 'ai-modified';
  author?: string;
  changeDescription?: string;
}

export interface ModuleVersionHistory {
  moduleId: string;
  currentVersionId: string;
  versions: ContentVersion[];
}

export interface GrantVersionState {
  applicationId: string;
  modules: Record<string, ModuleVersionHistory>;
  lastSaved: string;
}

// Generate unique version ID
export function generateVersionId(): string {
  return `v-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Create a new version
export function createVersion(
  content: string,
  source: ContentVersion['source'],
  changeDescription?: string
): ContentVersion {
  return {
    id: generateVersionId(),
    timestamp: new Date().toISOString(),
    content,
    source,
    changeDescription
  };
}

// Add version to module history
export function addVersionToModule(
  history: ModuleVersionHistory,
  version: ContentVersion
): ModuleVersionHistory {
  return {
    ...history,
    currentVersionId: version.id,
    versions: [...history.versions, version]
  };
}

// Get current version content
export function getCurrentVersion(history: ModuleVersionHistory): ContentVersion | null {
  return history.versions.find(v => v.id === history.currentVersionId) || null;
}

// Restore to a previous version
export function restoreVersion(
  history: ModuleVersionHistory,
  versionId: string
): ModuleVersionHistory {
  const targetVersion = history.versions.find(v => v.id === versionId);
  if (!targetVersion) return history;
  
  // Create a new version that's a restoration
  const restoredVersion = createVersion(
    targetVersion.content,
    'user',
    `Restored from version ${versionId}`
  );
  
  return {
    ...history,
    currentVersionId: restoredVersion.id,
    versions: [...history.versions, restoredVersion]
  };
}

// Get version diff summary
export function getVersionSummary(history: ModuleVersionHistory): {
  totalVersions: number;
  userVersions: number;
  aiGeneratedVersions: number;
  aiModifiedVersions: number;
  firstVersion: string;
  lastVersion: string;
} {
  const versions = history.versions;
  return {
    totalVersions: versions.length,
    userVersions: versions.filter(v => v.source === 'user').length,
    aiGeneratedVersions: versions.filter(v => v.source === 'ai-generated').length,
    aiModifiedVersions: versions.filter(v => v.source === 'ai-modified').length,
    firstVersion: versions[0]?.timestamp || '',
    lastVersion: versions[versions.length - 1]?.timestamp || ''
  };
}

// Initialize empty module history
export function initModuleHistory(moduleId: string): ModuleVersionHistory {
  return {
    moduleId,
    currentVersionId: '',
    versions: []
  };
}

// Compare two versions (simple diff)
export function compareVersions(v1: ContentVersion, v2: ContentVersion): {
  added: number;
  removed: number;
  changed: boolean;
} {
  const words1 = v1.content.split(/\s+/);
  const words2 = v2.content.split(/\s+/);
  
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  
  const added = words2.filter(w => !set1.has(w)).length;
  const removed = words1.filter(w => !set2.has(w)).length;
  
  return {
    added,
    removed,
    changed: added > 0 || removed > 0
  };
}
