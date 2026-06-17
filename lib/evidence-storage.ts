// Centralized mapping utility using MongoDB backend APIs instead of localStorage

export interface StoredCase {
  _id?: string;
  caseNumber: string;
  caseName: string;
  createdDate: string;
  userId?: string;
  id?: string; // For backward compatibility
}

export interface StoredEvidence {
  _id?: string;
  fileName: string;
  imageData: string;
  uploadDate: string;
  analyzedDate?: string;
  status: "pending" | "analyzing" | "complete";
  result?: "authentic" | "tampered" | null;
  confidence?: number | null;
  size: string;
  type: string;
  caseId?: string;
  caseNumber?: string;
  caseName?: string;
  evidenceName?: string;
  metadata?: any;
  anomalies?: string[];
  aiDetection?: any;
  blockchainHash?: string | null;
  ipfsHash?: string | null;
  reportGenerated?: boolean;
  faceDetection?: any;
  id?: string; // For backward compatibility
}

// ==== EVIDENCE MANAGEMENT ====

export async function getAllEvidence(userId?: string): Promise<StoredEvidence[]> {
  try {
    const res = await fetch('/api/evidence');
    if (!res.ok) return [];
    const data = await res.json();
    return data.evidence.map((e: any) => ({ ...e, id: e._id }));
  } catch (error) {
    console.error('Error fetching evidence:', error);
    return [];
  }
}

export async function saveEvidence(evidence: StoredEvidence, userId?: string): Promise<StoredEvidence | null> {
  try {
    const isUpdate = evidence.id || evidence._id;
    let res: Response;
    if (isUpdate) {
      res = await fetch(`/api/evidence/${evidence.id || evidence._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(evidence),
      });
    } else {
      res = await fetch('/api/evidence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(evidence),
      });
    }

    if (res.ok) {
      const data = await res.json();
      const saved = data.evidence;
      return { ...saved, id: saved._id };
    }
    return null;
  } catch (error) {
    console.error('Error saving evidence:', error);
    return null;
  }
}

export async function getEvidenceById(id: string, userId?: string): Promise<StoredEvidence | null> {
  try {
    const res = await fetch(`/api/evidence/${id}`);
    if (!res.ok) return null;
    const data = await res.json();
    return { ...data.evidence, id: data.evidence._id };
  } catch (error) {
    console.error('Error fetching evidence by id:', error);
    return null;
  }
}

export async function deleteEvidence(id: string, userId?: string): Promise<void> {
  try {
    await fetch(`/api/evidence/${id}`, { method: 'DELETE' });
  } catch (error) {
    console.error('Error deleting evidence:', error);
  }
}

export async function renameEvidence(id: string, newName: string, userId?: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/evidence/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ evidenceName: newName }),
    });
    return res.ok;
  } catch (error) {
    console.error('Error renaming evidence:', error);
    return false;
  }
}

export async function updateEvidenceAnalysis(
  id: string,
  analysis: any,
  userId?: string
): Promise<void> {
  try {
    const updates = {
      analyzedDate: new Date().toISOString(),
      status: "complete",
      result: analysis.isTampered ? "tampered" : "authentic",
      confidence: analysis.confidence,
      metadata: analysis.metadata,
      anomalies: analysis.anomalies,
      aiDetection: analysis.aiDetection,
    };
    await fetch(`/api/evidence/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
  } catch (error) {
    console.error('Error updating analysis:', error);
  }
}

export async function clearAllEvidence(userId?: string): Promise<void> {
  console.warn("clearAllEvidence is disabled in database mode");
}

// ==== CASE MANAGEMENT ====

export async function getAllCases(userId?: string): Promise<StoredCase[]> {
  try {
    const res = await fetch('/api/cases');
    if (!res.ok) return [];
    const data = await res.json();
    return data.cases.map((c: any) => ({ ...c, id: c._id }));
  } catch (error) {
    console.error('Error fetchings cases:', error);
    return [];
  }
}

export async function saveCase(c: StoredCase, userId?: string): Promise<StoredCase | null> {
  try {
    const res = await fetch('/api/cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(c),
    });
    if (res.ok) {
      const data = await res.json();
      const created = data.case;
      return { ...created, id: created._id || created.id };
    }
    return null;
  } catch (error) {
    console.error('Error saving case:', error);
    return null;
  }
}

export async function getCaseById(id: string, userId?: string): Promise<StoredCase | null> {
  try {
    const all = await getAllCases(userId);
    return all.find(c => c.id === id) || null;
  } catch (error) {
    return null;
  }
}

export async function deleteCase(id: string, userId?: string): Promise<void> {
  try {
    await fetch(`/api/cases/${id}`, { method: 'DELETE' });
  } catch (error) {
    console.error('Error deleting case:', error);
  }
}

export async function getEvidenceByCase(caseId: string, userId?: string): Promise<StoredEvidence[]> {
  try {
    // Use server-side filter — avoids fetching all evidence and filtering in JS
    const res = await fetch(`/api/evidence/by-case/${caseId}`);
    if (res.ok) {
      const data = await res.json();
      return data.evidence.map((e: any) => ({ ...e, id: e._id || e.id }));
    }
    // Fallback: fetch all and filter (legacy path)
    const all = await getAllEvidence(userId);
    return all.filter(e => e.caseId === caseId);
  } catch (error) {
    return [];
  }
}

export async function getUserStats(userId?: string): Promise<{
  totalEvidence: number;
  totalCases: number;
  verified: number;
  tampered: number;
  reportsGenerated: number;
  onBlockchain: number;
}> {
  try {
    // Use the lightweight aggregate endpoint — single SQL query, no row data transferred
    const res = await fetch('/api/stats');
    if (res.ok) {
      const data = await res.json();
      return data;
    }
    // Fallback: calculate from evidence list (old path — will hit Neon harder)
    const [allEvidence, allCases] = await Promise.all([
      getAllEvidence(userId),
      getAllCases(userId)
    ]);

    const verified = allEvidence.filter(e => e.status === "complete" && e.result === "authentic").length;
    const tampered = allEvidence.filter(e => e.status === "complete" && e.result === "tampered").length;
    const onBlockchain = allEvidence.filter(e => e.blockchainHash).length;
    const reportsGenerated = allEvidence.filter(e => e.reportGenerated).length;

    return {
      totalEvidence: allEvidence.length,
      totalCases: allCases.length,
      verified,
      tampered,
      reportsGenerated,
      onBlockchain,
    };
  } catch (error) {
    return {
      totalEvidence: 0,
      totalCases: 0,
      verified: 0,
      tampered: 0,
      reportsGenerated: 0,
      onBlockchain: 0,
    };
  }
}
