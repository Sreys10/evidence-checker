// Centralized evidence storage utility using localStorage

export interface StoredCase {
  id: string;
  caseNumber: string;
  caseName: string;
  createdDate: string;
  userId?: string;
}

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
  // Case management
  caseId?: string;
  caseNumber?: string;
  caseName?: string;
  evidenceName?: string;

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
  ipfsHash?: string | null;
  reportGenerated?: boolean;
  faceDetection?: {
    faces_detected: number;
    matches: Array<{
      face_number: number;
      match_found: boolean;
      match_info: {
        person_name: string;
        distance: number;
        original_image_base64?: string;
        metadata?: {
          name?: string;
          age?: number;
          email?: string;
          phone?: string;
          notes?: string;
          added_by?: {
            name: string;
            email: string;
          };
        };
      } | null;
      face_image_base64: string;
    }>;
  };
}

const STORAGE_KEY_PREFIX = 'evidenceStorage_';
const CASES_KEY_PREFIX = 'casesStorage_';

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

// ---- CASE MANAGEMENT ----

function getCasesKey(userId?: string): string {
  if (typeof window === 'undefined') return '';
  if (!userId) userId = getCurrentUserId();
  return `${CASES_KEY_PREFIX}${userId}`;
}

export function getAllCases(userId?: string): StoredCase[] {
  if (typeof window === 'undefined') return [];
  try {
    const key = getCasesKey(userId);
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading cases:', error);
    return [];
  }
}

export function saveCase(c: StoredCase, userId?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const key = getCasesKey(userId);
    const all = getAllCases(userId);
    const idx = all.findIndex(x => x.id === c.id);
    if (idx >= 0) all[idx] = c; else all.push(c);
    localStorage.setItem(key, JSON.stringify(all));
  } catch (error) {
    console.error('Error saving case:', error);
  }
}

export function getCaseById(id: string, userId?: string): StoredCase | null {
  return getAllCases(userId).find(c => c.id === id) || null;
}

export function deleteCase(id: string, userId?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const key = getCasesKey(userId);
    const all = getAllCases(userId).filter(c => c.id !== id);
    localStorage.setItem(key, JSON.stringify(all));
    // Also delete evidence belonging to this case
    const storageKey = getStorageKey(userId);
    const allEvidence = getAllEvidence(userId).filter(e => e.caseId !== id);
    localStorage.setItem(storageKey, JSON.stringify(allEvidence));
  } catch (error) {
    console.error('Error deleting case:', error);
  }
}

export function getEvidenceByCase(caseId: string, userId?: string): StoredEvidence[] {
  return getAllEvidence(userId).filter(e => e.caseId === caseId);
}

/**
 * Get statistics for current user
 */
export function getUserStats(userId?: string): {
  totalEvidence: number;
  totalCases: number;
  verified: number;
  tampered: number;
  reportsGenerated: number;
  onBlockchain: number;
} {
  const allEvidence = getAllEvidence(userId);
  const allCases = getAllCases(userId);
  const verified = allEvidence.filter(e => e.status === "complete" && e.result === "authentic").length;
  const tampered = allEvidence.filter(e => e.status === "complete" && e.result === "tampered").length;

  // Count reports generated
  let reportsGenerated = 0;
  try {
    const savedReports = localStorage.getItem('generatedReports');
    if (savedReports) {
      const reports = JSON.parse(savedReports);
      // const _currentUserId = userId || getCurrentUserId(); // check if this is needed for filter? 
      // It is used in filter callback line 326 check?
      // "return r.generatedBy?.email === user.email;" -> user comes from localStorage inside callback. 
      // _currentUserId is NOT used in the callback.
      // So remove it.
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
    totalCases: allCases.length,
    verified,
    tampered,
    reportsGenerated,
    onBlockchain,
  };
}

