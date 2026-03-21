import { getDatabase } from '../mongodb';
import { ObjectId } from 'mongodb';

export interface Case {
  _id?: string | ObjectId;
  caseNumber: string;
  caseName: string;
  createdDate: string;
  userId: string;
}

export async function createCase(caseData: Omit<Case, '_id'>): Promise<Case> {
  const db = await getDatabase();
  const result = await db.collection<Case>('cases').insertOne(caseData as Case);
  return { ...caseData, _id: result.insertedId.toString() };
}

export async function getCasesByUser(userId: string): Promise<Case[]> {
  const db = await getDatabase();
  const cases = await db.collection<Case>('cases').find({ userId }).sort({ createdDate: -1 }).toArray();
  return cases.map(c => ({ ...c, _id: c._id?.toString() }));
}

export async function deleteCase(id: string, userId: string): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.collection('cases').deleteOne({ _id: new ObjectId(id), userId });
  
  // Cascade delete evidence associated with this case
  if (result.deletedCount > 0) {
    await db.collection('evidence').deleteMany({ caseId: id, userId });
  }
  
  return result.deletedCount > 0;
}
