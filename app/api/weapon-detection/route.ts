import { NextRequest, NextResponse } from 'next/server';

/**
 * Weapon Detection API Route
 * Status: NOT IMPLEMENTED
 * 
 * This feature requires a weapon-detection ML model (e.g., YOLOv8 fine-tuned on weapon classes).
 * To implement:
 *   1. Add a /weapon-detect endpoint to backend-service/app.py
 *   2. Forward image frames to it from this route
 *   3. Return detected weapon classes and bounding boxes
 */
export async function POST(_request: NextRequest) {
  return NextResponse.json(
    {
      error: 'Weapon detection is not yet implemented.',
      message: 'This feature is planned for a future release.',
    },
    { status: 501 }
  );
}
