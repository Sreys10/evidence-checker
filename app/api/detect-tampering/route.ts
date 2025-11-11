import { NextRequest, NextResponse } from 'next/server';

// Backend service URL - set via environment variable
const BACKEND_SERVICE_URL = process.env.BACKEND_SERVICE_URL || 'http://localhost:5000';

// Log backend URL in development (not in production for security)
if (process.env.NODE_ENV === 'development') {
  console.log('Backend Service URL:', BACKEND_SERVICE_URL);
}

export async function POST(request: NextRequest) {
  try {
    const requestFormData = await request.formData();
    const file = requestFormData.get('image') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Convert file to buffer for forwarding
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create FormData for backend service
    // Note: In Node.js, we need to use a different approach
    const FormDataClass = (await import('form-data')).default;
    const backendFormData = new FormDataClass();
    backendFormData.append('image', buffer, {
      filename: file.name,
      contentType: file.type,
    });

    try {
      const backendUrl = `${BACKEND_SERVICE_URL}/detect`;
      console.log('Calling backend at:', backendUrl);
      
      const response = await fetch(backendUrl, {
        method: 'POST',
        body: backendFormData as unknown as BodyInit,
        headers: backendFormData.getHeaders(),
      });

      console.log('Backend response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend error response:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || `Backend returned ${response.status}` };
        }
        
        return NextResponse.json(
          {
            error: 'Analysis failed',
            details: errorData.error || errorData.message || `Backend returned ${response.status}`,
          },
          { status: response.status }
        );
      }

      const results = await response.json();

      // Check for errors in results
      if (results.status === 'error') {
        return NextResponse.json(
          {
            error: 'Analysis failed',
            details: results.error || results.message,
          },
          { status: 500 }
        );
      }

      // Transform results to match frontend expectations
      const transformedResults = transformDetectionResults(results);

      return NextResponse.json(
        {
          success: true,
          result: transformedResults,
        },
        { status: 200 }
      );
    } catch (fetchError) {
      console.error('Backend service request failed:', fetchError);
      console.error('Error type:', fetchError instanceof Error ? fetchError.constructor.name : typeof fetchError);
      console.error('Error message:', fetchError instanceof Error ? fetchError.message : String(fetchError));
      
      // Check if backend service is reachable
      if (fetchError instanceof TypeError) {
        const errorMsg = fetchError.message || String(fetchError);
        return NextResponse.json(
          {
            error: 'Backend service unavailable',
            details: `Cannot connect to backend service at ${BACKEND_SERVICE_URL}. Error: ${errorMsg}. Please check if BACKEND_SERVICE_URL is set correctly in Vercel environment variables.`,
          },
          { status: 503 }
        );
      }

      return NextResponse.json(
        {
          error: 'Backend request failed',
          details: fetchError instanceof Error ? fetchError.message : String(fetchError),
        },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error('Tampering detection error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { 
        error: 'Failed to analyze image',
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}

interface DetectionResults {
  deepfake?: {
    type?: { deepfake?: number };
    status?: string;
  };
  ai_generated?: {
    type?: { ai_generated?: number };
    status?: string;
  };
  quality?: {
    quality?: { score?: number };
    media?: { type?: string };
    status?: string;
  };
  scammer?: {
    scam?: { prob?: number };
    faces?: Array<{ x1?: number; y1?: number }>;
    status?: string;
  };
  status?: string;
  error?: string;
}

function transformDetectionResults(results: DetectionResults) {
  // Extract key information from detection results
  const deepfake = results.deepfake?.type?.deepfake || 0;
  const aiGenerated = results.ai_generated?.type?.ai_generated || 0;
  const quality = results.quality?.quality?.score || 0;
  const scamProb = results.scammer?.scam?.prob || 0;

  // Determine if tampered based on thresholds
  const isTampered = deepfake > 0.5 || aiGenerated > 0.5 || quality < 0.4;
  
  // Calculate overall confidence (inverse of tampering probability)
  const tamperingScore = Math.max(deepfake, aiGenerated, 1 - quality);
  const confidence = (1 - tamperingScore) * 100;

  // Build anomalies array
  const anomalies: string[] = [];
  if (deepfake > 0.5) {
    anomalies.push(`Deepfake probability: ${(deepfake * 100).toFixed(1)}%`);
  }
  if (aiGenerated > 0.5) {
    anomalies.push(`AI-generated content detected: ${(aiGenerated * 100).toFixed(1)}%`);
  }
  if (quality < 0.4) {
    anomalies.push(`Low image quality score: ${(quality * 100).toFixed(1)}%`);
  }
  if (scamProb > 0.5) {
    anomalies.push(`Scammer detection probability: ${(scamProb * 100).toFixed(1)}%`);
  }

  // Extract metadata if available
  const metadata: Record<string, unknown> = {};
  if (results.quality?.media?.type) {
    metadata.format = results.quality.media.type;
  }

  return {
    isTampered,
    confidence: Math.max(0, Math.min(100, confidence)),
    anomalies,
    metadata,
    analysis: {
      pixelAnalysis: quality * 100,
      metadataAnalysis: (1 - Math.max(deepfake, aiGenerated)) * 100,
      compressionAnalysis: quality * 100,
      overallScore: confidence,
    },
    aiDetection: {
      deepfake: deepfake,
      aiGenerated: aiGenerated,
      quality: quality,
      scamProb: scamProb,
      rawResults: results as Record<string, unknown>,
    },
  };
}

