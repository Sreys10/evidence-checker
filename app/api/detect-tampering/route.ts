import { NextRequest, NextResponse } from 'next/server';

// Backend service URL - set via environment variable
const BACKEND_SERVICE_URL = process.env.BACKEND_SERVICE_URL || 'http://localhost:5001';

// Log backend URL in development (not in production for security)
if (process.env.NODE_ENV === 'development') {
  console.log('Backend Service URL:', BACKEND_SERVICE_URL);
}

export async function POST(request: NextRequest) {
  try {
    let buffer: Buffer;
    let fileName: string = 'image.jpg';
    let fileType: string = 'image/jpeg';

    const contentTypeHeader = request.headers.get('content-type') || '';
    if (contentTypeHeader.includes('application/json')) {
      const body = await request.json();
      const imageUrl = body.imageUrl;
      if (!imageUrl) {
        return NextResponse.json(
          { error: 'No imageUrl provided in JSON body' },
          { status: 400 }
        );
      }
      console.log('Downloading image from URL:', imageUrl);
      const imgRes = await fetch(imageUrl);
      if (!imgRes.ok) {
        return NextResponse.json(
          { error: `Failed to download image from URL: ${imgRes.statusText}` },
          { status: 400 }
        );
      }
      const bytes = await imgRes.arrayBuffer();
      buffer = Buffer.from(bytes);
      
      const urlParts = imageUrl.split('/');
      fileName = urlParts[urlParts.length - 1] || 'image.jpg';
      if (!fileName.includes('.')) fileName += '.jpg';
    } else {
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

      fileName = file.name;
      fileType = file.type;
      const bytes = await file.arrayBuffer();
      buffer = Buffer.from(bytes);
    }

    try {
      const backendUrl = `${BACKEND_SERVICE_URL}/detect`;
      const metadataUrl = `${BACKEND_SERVICE_URL}/metadata/analyze`;
      console.log('Calling backend services...');
      console.log('File name:', fileName);
      console.log('File type:', fileType);
      console.log('File size:', buffer.length);

      // Use axios for better form-data handling
      const axios = (await import('axios')).default;
      const FormDataClass = (await import('form-data')).default;
      
      const FormDataInstance = new FormDataClass();
      FormDataInstance.append('image', buffer, {
        filename: fileName || 'image.jpg',
        contentType: fileType || 'image/jpeg',
      });

      const FormDataInstance2 = new FormDataClass();
      FormDataInstance2.append('image', buffer, {
        filename: fileName || 'image.jpg',
        contentType: fileType || 'image/jpeg',
      });

      let results: any = null;
      let metaResults: any = null;

      try {
        const [detectRes, metadataRes] = await Promise.all([
          axios.post(backendUrl, FormDataInstance, {
            headers: {
              ...FormDataInstance.getHeaders(),
              'X-API-Key': process.env.EVI_CHECK_API_KEY || 'default-api-key-replace-me',
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            timeout: 60000,
          }),
          axios.post(metadataUrl, FormDataInstance2, {
            headers: {
              ...FormDataInstance2.getHeaders(),
              'X-API-Key': process.env.EVI_CHECK_API_KEY || 'default-api-key-replace-me',
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            timeout: 60000,
          }).catch(err => {
            console.error('Metadata analysis sub-request failed:', err.message);
            return { data: null };
          })
        ]);

        results = detectRes.data;
        metaResults = metadataRes.data;
      } catch (err) {
        console.error('Parallel backend requests failed:', err);
        throw err;
      }

      // Check for errors in results
      if (!results || results.status === 'error') {
        console.error('Backend returned error:', results);
        return NextResponse.json(
          {
            error: 'Analysis failed',
            details: results?.error || results?.message || 'Unknown error from backend',
          },
          { status: 500 }
        );
      }

      // Transform results to match frontend expectations
      const transformedResults = transformDetectionResults(results, metaResults);

      return NextResponse.json(
        {
          success: true,
          result: transformedResults,
        },
        { status: 200 }
      );
    } catch (axiosError: unknown) {
      console.error('Axios request failed:', axiosError);

      // Handle axios errors - they have response data
      const axios = (await import('axios')).default;
      if (axios.isAxiosError(axiosError)) {
        const status = axiosError.response?.status || 500;
        const errorData = axiosError.response?.data;
        const errorMessage = axiosError.message;

        console.error('Axios error status:', status);
        console.error('Axios error data:', errorData);
        console.error('Axios error message:', errorMessage);

        // Return detailed error information
        return NextResponse.json(
          {
            error: 'Analysis failed',
            details: errorData?.error || errorData?.message || errorMessage || `Backend returned ${status}`,
            backendError: errorData,
          },
          { status: status }
        );
      }

      // If not an axios error, treat as generic error
      const errorMessage = axiosError instanceof Error ? axiosError.message : String(axiosError);
      return NextResponse.json(
        {
          error: 'Failed to send request to backend',
          details: errorMessage,
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
  weapon_detection?: {
    weaponsFound: boolean;
    weaponsDetected: string[];
    detections: Array<{
      class: string;
      confidence: number;
      bbox: { x: number; y: number; width: number; height: number };
    }>;
    anomalies: string[];
    totalDetections: number;
    rawResult: any;
  };
  status?: string;
  error?: string;
}

function transformDetectionResults(results: DetectionResults, metaResults: any) {
  // Extract key information from detection results
  const deepfake = results.deepfake?.type?.deepfake || 0;
  const aiGenerated = results.ai_generated?.type?.ai_generated || 0;
  const quality = results.quality?.quality?.score || 0;
  const scamProb = results.scammer?.scam?.prob || 0;
  const weaponDetection = results.weapon_detection;

  // Determine if ELA/metadata flagged tampering based on content manipulation signals
  const hasElaTampering = metaResults?.ela?.performed && metaResults.ela.meanIntensity > 6.0;
  const hasPrnuTampering = metaResults?.prnu?.performed && metaResults.prnu.suspiciousRatio > 0.10;
  const hasSoftwareEdit = metaResults?.metadataFlags?.some((f: any) => 
    f.text.toLowerCase().includes('edited using')
  );
  const isMetadataTampered = !!(
    hasElaTampering || 
    hasPrnuTampering || 
    hasSoftwareEdit || 
    (metaResults && (
      metaResults.risk === 'HIGH' || 
      metaResults.risk === 'CRITICAL' || 
      (metaResults.score && metaResults.score > 7)
    ))
  );

  // Determine if tampered based on thresholds (excluding simple quality score to avoid false positives on authentic low-quality images)
  const isTampered = deepfake > 0.5 || aiGenerated > 0.5 || isMetadataTampered || (weaponDetection?.weaponsFound || false);

  // Calculate overall confidence (representing certainty of the assigned verdict)
  const cloudTamperScore = Math.max(deepfake, aiGenerated);
  const metadataTamperScore = metaResults ? (metaResults.score || 0) / 24 : 0;
  const overallTamperScore = Math.max(cloudTamperScore, metadataTamperScore);
  const confidence = isTampered ? overallTamperScore * 100 : (1 - overallTamperScore) * 100;

  // Build anomalies array
  const anomalies: string[] = [];
  if (deepfake > 0.5) {
    anomalies.push(`Deepfake probability: ${(deepfake * 100).toFixed(1)}%`);
  }
  if (aiGenerated > 0.5) {
    anomalies.push(`AI-generated content detected: ${(aiGenerated * 100).toFixed(1)}%`);
  }
  if (scamProb > 0.5) {
    anomalies.push(`Scammer detection probability: ${(scamProb * 100).toFixed(1)}%`);
  }

  // Include weapon anomalies if weapons were detected
  if (weaponDetection?.weaponsFound && weaponDetection.anomalies) {
    anomalies.push(...weaponDetection.anomalies);
  }

  // Include metadata flags and ELA/PRNU reasons
  if (metaResults) {
    if (metaResults.metadataFlags) {
      anomalies.push(...metaResults.metadataFlags.map((f: any) => f.text));
    }
    if (metaResults.reasons) {
      anomalies.push(...metaResults.reasons);
    }
  }

  // Build merged metadata object
  const metadata: Record<string, unknown> = {
    ...(metaResults || {}),
  };
  if (results.quality?.media?.type) {
    metadata.format = results.quality.media.type;
  }

  return {
    isTampered,
    confidence: Math.max(0, Math.min(100, confidence)),
    anomalies: Array.from(new Set(anomalies)), // deduplicate
    metadata,
    aiDetection: {
      deepfake: deepfake,
      aiGenerated: aiGenerated,
      quality: quality,
      scamProb: scamProb,
      rawResults: results as Record<string, unknown>,
    },
    weaponDetection: weaponDetection || null,
  };
}

