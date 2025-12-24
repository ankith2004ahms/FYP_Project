import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export interface User {
  _id?: string | ObjectId;
  id?: string;
  fullName: string;
  email: string;
  phone?: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export type UserCreateInput = Omit<User, '_id' | 'id' | 'createdAt' | 'updatedAt'>;
export type UserUpdateInput = Partial<Omit<User, '_id' | 'id' | 'createdAt' | 'updatedAt'>>;

export async function findUserByEmail(email: string): Promise<User | null> {
  const db = await getDb();
  const user = await db.collection('users').findOne({ email });
  if (!user) return null;
  // @ts-ignore
  return {
    ...user,
    id: user._id.toString()
  };
}

export async function findUserById(id: string): Promise<User | null> {
  const db = await getDb();
  const user = await db.collection('users').findOne({ _id: new ObjectId(id) });
  if (!user) return null;
  // @ts-ignore
  return {
    ...user,
    id: user._id.toString()
  };
}

export async function createUser(data: UserCreateInput): Promise<User> {
  const db = await getDb();
  
  const now = new Date();
  const userData = {
    ...data,
    createdAt: now,
    updatedAt: now
  };
  
  const result = await db.collection('users').insertOne(userData);
  
  return {
    ...userData,
    _id: result.insertedId,
    id: result.insertedId.toString()
  };
}

export async function updateUser(id: string, data: UserUpdateInput): Promise<User | null> {
  const db = await getDb();
  
  const updateData = {
    ...data,
    updatedAt: new Date()
  };
  
  await db.collection('users').updateOne(
    { _id: new ObjectId(id) },
    { $set: updateData }
  );
  
  return findUserById(id);
}

export async function deleteUser(id: string): Promise<boolean> {
  const db = await getDb();
  const result = await db.collection('users').deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
} 