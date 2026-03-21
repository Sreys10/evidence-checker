import { getDatabase } from '../mongodb';
import { ObjectId } from 'mongodb';

export interface Evidence {
  _id?: string | ObjectId;
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
  
  // Identifiers
  userId: string;
  
  // Dynamic payloads
  metadata?: any;
  anomalies?: string[];
  aiDetection?: any;
  blockchainHash?: string | null;
  ipfsHash?: string | null;
  reportGenerated?: boolean;
  faceDetection?: any;
}

export async function createEvidence(data: Omit<Evidence, '_id'>): Promise<Evidence> {
  const db = await getDatabase();
  const result = await db.collection<Evidence>('evidence').insertOne(data as Evidence);
  return { ...data, _id: result.insertedId.toString() };
}

export async function getEvidenceByUser(userId: string): Promise<Evidence[]> {
  const db = await getDatabase();
  const docs = await db.collection<Evidence>('evidence').find({ userId }).sort({ uploadDate: -1 }).toArray();
  return docs.map(d => ({ ...d, _id: d._id?.toString() }));
}

export async function getEvidenceById(id: string, userId: string): Promise<Evidence | null> {
  const db = await getDatabase();
  const doc = await db.collection<Evidence>('evidence').findOne({ _id: new ObjectId(id), userId });
  return doc ? { ...doc, _id: doc._id?.toString() } as Evidence : null;
}

export async function updateEvidence(id: string, userId: string, updateData: Partial<Evidence>): Promise<boolean> {
  const db = await getDatabase();
  // Protect restricted fields
  delete updateData._id;
  delete updateData.userId;
  
  const result = await db.collection('evidence').updateOne(
    { _id: new ObjectId(id), userId },
    { $set: updateData }
  );
  return result.matchedCount > 0;
}

export async function deleteEvidence(id: string, userId: string): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.collection('evidence').deleteOne({ _id: new ObjectId(id), userId });
  return result.deletedCount > 0;
}
