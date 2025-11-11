// Centralized evidence storage utility using localStorage

export interface StoredEvidence {
  id: string;
  fileName: string;
  imageData: string; // Base64 data URL
  uploadDate: string;
  analyzedDate?: string;
  status: "pending" | "analyzing" | "complete";
  result?: "authentic" | "tampered" | null;
  confidence?: number | null;
  size: string;
  type: string;
  analysis?: {
    pixelAnalysis: number;
    metadataAnalysis: number;
    compressionAnalysis: number;
    overallScore: number;
  };
  metadata?: {
    camera?: string;
    date?: string;
    location?: string;
    software?: string;
  };
  anomalies?: string[];
  aiDetection?: {
    deepfake: number;
    aiGenerated: number;
    quality: number;
    scamProb: number;
  };
  blockchainHash?: string | null;
  reportGenerated?: boolean;
}

const STORAGE_KEY_PREFIX = 'evidenceStorage_';

/**
 * Get storage key for a specific user
 */
function getStorageKey(userId?: string): string {
  if (typeof window === 'undefined') return '';
  
  if (!userId) {
    // Try to get user from localStorage
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        userId = user._id || user.email || 'anonymous';
      } else {
        userId = 'anonymous';
      }
    } catch {
      userId = 'anonymous';
    }
  }
  
  return `${STORAGE_KEY_PREFIX}${userId}`;
}

/**
 * Get current user ID
 */
function getCurrentUserId(): string {
  if (typeof window === 'undefined') return 'anonymous';
  
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user._id || user.email || 'anonymous';
    }
  } catch {
    // Ignore errors
  }
  
  return 'anonymous';
}

/**
 * Get all stored evidence for current user
 */
export function getAllEvidence(userId?: string): StoredEvidence[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const storageKey = getStorageKey(userId);
    const stored = localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading evidence from storage:', error);
    return [];
  }
}

/**
 * Save evidence to storage
 */
export function saveEvidence(evidence: StoredEvidence, userId?: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const storageKey = getStorageKey(userId);
    const allEvidence = getAllEvidence(userId);
    const existingIndex = allEvidence.findIndex(e => e.id === evidence.id);
    
    if (existingIndex >= 0) {
      // Update existing evidence
      allEvidence[existingIndex] = evidence;
    } else {
      // Add new evidence
      allEvidence.push(evidence);
    }
    
    localStorage.setItem(storageKey, JSON.stringify(allEvidence));
  } catch (error) {
    console.error('Error saving evidence to storage:', error);
  }
}

/**
 * Get evidence by ID
 */
export function getEvidenceById(id: string, userId?: string): StoredEvidence | null {
  const allEvidence = getAllEvidence(userId);
  return allEvidence.find(e => e.id === id) || null;
}

/**
 * Delete evidence by ID
 */
export function deleteEvidence(id: string, userId?: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const storageKey = getStorageKey(userId);
    const allEvidence = getAllEvidence(userId);
    const filtered = allEvidence.filter(e => e.id !== id);
    localStorage.setItem(storageKey, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting evidence from storage:', error);
  }
}

/**
 * Rename evidence by ID
 */
export function renameEvidence(id: string, newFileName: string, userId?: string): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const evidence = getEvidenceById(id, userId);
    if (!evidence) return false;
    
    evidence.fileName = newFileName;
    saveEvidence(evidence, userId);
    return true;
  } catch (error) {
    console.error('Error renaming evidence:', error);
    return false;
  }
}

/**
 * Update evidence analysis results
 */
export function updateEvidenceAnalysis(
  id: string,
  analysis: {
    isTampered: boolean;
    confidence: number;
    anomalies: string[];
    analysis: {
      pixelAnalysis: number;
      metadataAnalysis: number;
      compressionAnalysis: number;
      overallScore: number;
    };
    metadata?: Record<string, unknown>;
    aiDetection?: {
      deepfake: number;
      aiGenerated: number;
      quality: number;
      scamProb: number;
      rawResults?: Record<string, unknown>;
    };
  },
  userId?: string
): void {
  const evidence = getEvidenceById(id, userId);
  if (!evidence) return;
  
  evidence.analyzedDate = new Date().toISOString();
  evidence.status = "complete";
  evidence.result = analysis.isTampered ? "tampered" : "authentic";
  evidence.confidence = analysis.confidence;
  evidence.analysis = analysis.analysis;
  evidence.metadata = analysis.metadata || evidence.metadata;
  evidence.anomalies = analysis.anomalies;
  evidence.aiDetection = analysis.aiDetection;
  
  saveEvidence(evidence, userId);
}

/**
 * Clear all evidence for current user (for testing/reset)
 */
export function clearAllEvidence(userId?: string): void {
  if (typeof window === 'undefined') return;
  const storageKey = getStorageKey(userId);
  localStorage.removeItem(storageKey);
}

/**
 * Get statistics for current user
 */
export function getUserStats(userId?: string): {
  totalEvidence: number;
  verified: number;
  tampered: number;
  reportsGenerated: number;
  onBlockchain: number;
} {
  const allEvidence = getAllEvidence(userId);
  const verified = allEvidence.filter(e => e.status === "complete" && e.result === "authentic").length;
  const tampered = allEvidence.filter(e => e.status === "complete" && e.result === "tampered").length;
  
  // Count reports generated
  let reportsGenerated = 0;
  try {
    const savedReports = localStorage.getItem('generatedReports');
    if (savedReports) {
      const reports = JSON.parse(savedReports);
      const currentUserId = userId || getCurrentUserId();
      // Filter reports by current user
      reportsGenerated = reports.filter((r: { generatedBy?: { email?: string } }) => {
        try {
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const user = JSON.parse(userStr);
            return r.generatedBy?.email === user.email;
          }
        } catch {
          // Ignore
        }
        return false;
      }).length;
    }
  } catch {
    // Ignore
  }
  
  const onBlockchain = allEvidence.filter(e => e.blockchainHash).length;
  
  return {
    totalEvidence: allEvidence.length,
    verified,
    tampered,
    reportsGenerated,
    onBlockchain,
  };
}

