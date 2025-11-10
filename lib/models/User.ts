import { getDatabase } from '../mongodb';
import bcrypt from 'bcryptjs';

export interface User {
  _id?: string;
  name: string;
  email: string;
  password: string;
  userType: 'admin' | 'analyst' | 'verifier' | 'guest';
  createdAt?: Date;
  updatedAt?: Date;
  lastLogin?: Date;
}

export async function createUser(userData: Omit<User, '_id' | 'createdAt' | 'updatedAt'>): Promise<User> {
  const db = await getDatabase();
  const usersCollection = db.collection<User>('users');

  // Check if user already exists
  const existingUser = await usersCollection.findOne({ email: userData.email });
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(userData.password, 10);

  // Create user
  const newUser: Omit<User, '_id'> = {
    ...userData,
    password: hashedPassword,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await usersCollection.insertOne(newUser as any);
  
  return {
    ...newUser,
    _id: result.insertedId.toString(),
  };
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const db = await getDatabase();
  const usersCollection = db.collection<User>('users');
  return await usersCollection.findOne({ email });
}

export async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

export async function updateLastLogin(email: string): Promise<void> {
  const db = await getDatabase();
  const usersCollection = db.collection<User>('users');
  await usersCollection.updateOne(
    { email },
    { $set: { lastLogin: new Date(), updatedAt: new Date() } }
  );
}

export async function getAllUsers(): Promise<Omit<User, 'password'>[]> {
  const db = await getDatabase();
  const usersCollection = db.collection<User>('users');
  const users = await usersCollection.find({}).toArray();
  return users.map(({ password, ...user }) => user);
}

