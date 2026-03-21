import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt } from '@/lib/jwt';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function DELETE(
  req: NextRequest,
  { params }: { params: any }
) {
  try {
    const token = req.cookies.get('evicheck_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyJwt(token);
    if (!payload || payload.userType !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const db = await getDatabase();
    
    // Prevent admin from deleting themselves
    if (payload.id === id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    try {
      const result = await db.collection('users').deleteOne({ _id: new ObjectId(id) as any });
      if (result.deletedCount === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
    } catch (e) {
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('User Delete Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
