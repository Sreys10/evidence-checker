// Report generation utilities

export interface ReportData {
  id: string;
  fileName: string;
  evidenceName: string;
  imageData: string; // Base64 or URL
  generatedDate: string;
  generatedBy: {
    name: string;
    email: string;
  };
  status: "authentic" | "tampered";
  confidence: number;
  analysis?: {
    pixelAnalysis: number;
    metadataAnalysis: number;
    compressionAnalysis: number;
    overallScore: number;
  };
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
}

export const generateHTMLReport = (data: ReportData): string => {
  const statusColor = data.status === "authentic" ? "#10b981" : "#ef4444";
  const statusIcon = data.status === "authentic" ? "✓" : "⚠";
  const riskLevel = data.confidence > 80 ? "LOW" : data.confidence > 50 ? "MEDIUM" : "HIGH";
  const riskColor = riskLevel === "LOW" ? "#10b981" : riskLevel === "MEDIUM" ? "#f59e0b" : "#ef4444";
  
  // Calculate detailed analysis metrics
  const getAnalysisInterpretation = (score: number, type: string) => {
    if (score >= 90) return { level: "Excellent", color: "#10b981", desc: "No anomalies detected" };
    if (score >= 75) return { level: "Good", color: "#22c55e", desc: "Minimal concerns" };
    if (score >= 60) return { level: "Moderate", color: "#f59e0b", desc: "Some inconsistencies noted" };
    if (score >= 40) return { level: "Poor", color: "#f97316", desc: "Significant issues detected" };
    return { level: "Critical", color: "#ef4444", desc: "Severe tampering indicators" };
  };

  const pixelAnalysis = data.analysis ? getAnalysisInterpretation(data.analysis.pixelAnalysis, "pixel") : null;
  const metadataAnalysis = data.analysis ? getAnalysisInterpretation(data.analysis.metadataAnalysis, "metadata") : null;
  const compressionAnalysis = data.analysis ? getAnalysisInterpretation(data.analysis.compressionAnalysis, "compression") : null;

  const reportDate = new Date(data.generatedDate);
  const formattedDate = reportDate.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Digital Forensics Analysis Report - ${data.evidenceName}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.7;
      color: #1f2937;
      background: #f9fafb;
      padding: 20px;
    }
    .container {
      max-width: 1000px;
      margin: 0 auto;
      background: white;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      border-radius: 12px;
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #6366f1 100%);
      color: white;
      padding: 50px 40px;
      text-align: center;
      border-bottom: 4px solid #1e40af;
    }
    .header h1 {
      font-size: 36px;
      margin-bottom: 10px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .header .subtitle {
      opacity: 0.95;
      font-size: 18px;
      font-weight: 300;
      margin-bottom: 20px;
    }
    .header .report-id {
      background: rgba(255, 255, 255, 0.2);
      padding: 8px 16px;
      border-radius: 20px;
      display: inline-block;
      font-size: 12px;
      font-weight: 500;
      letter-spacing: 0.5px;
    }
    .content {
      padding: 50px 40px;
    }
    .section {
      margin-bottom: 50px;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: 26px;
      font-weight: 700;
      color: #1e3a8a;
      margin-bottom: 25px;
      padding-bottom: 12px;
      border-bottom: 3px solid #3b82f6;
      letter-spacing: -0.3px;
    }
    .subsection-title {
      font-size: 18px;
      font-weight: 600;
      color: #374151;
      margin: 25px 0 15px 0;
      padding-left: 15px;
      border-left: 4px solid #3b82f6;
    }
    .executive-summary {
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border: 2px solid #3b82f6;
      border-radius: 12px;
      padding: 30px;
      margin-bottom: 40px;
    }
    .executive-summary h3 {
      color: #1e3a8a;
      font-size: 20px;
      margin-bottom: 15px;
      font-weight: 700;
    }
    .status-badge {
      display: inline-block;
      padding: 14px 28px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 20px;
      background: ${statusColor};
      color: white;
      margin: 15px 0;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      letter-spacing: 0.5px;
    }
    .risk-badge {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 14px;
      background: ${riskColor};
      color: white;
      margin-left: 10px;
    }
    .image-container {
      text-align: center;
      margin: 30px 0;
      background: #f9fafb;
      padding: 25px;
      border-radius: 12px;
      border: 2px solid #e5e7eb;
    }
    .image-container img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
      border: 1px solid #d1d5db;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin: 25px 0;
    }
    .info-item {
      background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
      padding: 22px;
      border-radius: 10px;
      border-left: 5px solid #3b82f6;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      transition: transform 0.2s;
    }
    .info-item:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    .info-item label {
      display: block;
      font-size: 11px;
      text-transform: uppercase;
      color: #6b7280;
      margin-bottom: 10px;
      font-weight: 700;
      letter-spacing: 1px;
    }
    .info-item value {
      display: block;
      font-size: 18px;
      color: #1f2937;
      font-weight: 600;
    }
    .analysis-scores {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 20px;
      margin: 25px 0;
    }
    .score-card {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: white;
      padding: 25px;
      border-radius: 12px;
      text-align: center;
      box-shadow: 0 6px 20px rgba(99, 102, 241, 0.3);
      transition: transform 0.2s;
    }
    .score-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 25px rgba(99, 102, 241, 0.4);
    }
    .score-card label {
      display: block;
      font-size: 12px;
      opacity: 0.95;
      margin-bottom: 10px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    .score-card value {
      display: block;
      font-size: 36px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .score-card .interpretation {
      font-size: 11px;
      opacity: 0.9;
      font-weight: 500;
      margin-top: 8px;
    }
    .detailed-analysis {
      background: #f9fafb;
      border-radius: 10px;
      padding: 25px;
      margin: 20px 0;
      border-left: 5px solid #6366f1;
    }
    .analysis-item {
      padding: 18px;
      background: white;
      border-radius: 8px;
      margin-bottom: 15px;
      border-left: 4px solid #3b82f6;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
    }
    .analysis-item h4 {
      color: #1e3a8a;
      font-size: 16px;
      margin-bottom: 8px;
      font-weight: 600;
    }
    .analysis-item p {
      color: #4b5563;
      font-size: 14px;
      line-height: 1.6;
      margin-top: 8px;
    }
    .methodology {
      background: #fef3c7;
      border: 2px solid #fbbf24;
      border-radius: 10px;
      padding: 25px;
      margin: 25px 0;
    }
    .methodology h4 {
      color: #92400e;
      margin-bottom: 15px;
      font-weight: 700;
    }
    .methodology ul {
      margin-left: 20px;
      color: #78350f;
    }
    .methodology li {
      margin: 8px 0;
      line-height: 1.6;
    }
    .anomalies {
      background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
      border: 2px solid #f87171;
      border-radius: 12px;
      padding: 25px;
      margin: 25px 0;
    }
    .anomalies h3 {
      color: #991b1b;
      margin-bottom: 18px;
      font-size: 20px;
      font-weight: 700;
    }
    .anomalies ul {
      list-style: none;
      padding: 0;
    }
    .anomalies li {
      padding: 12px 16px;
      background: white;
      margin: 10px 0;
      border-radius: 6px;
      border-left: 4px solid #dc2626;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      font-weight: 500;
      color: #7f1d1d;
    }
    .recommendations {
      background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
      border: 2px solid #22c55e;
      border-radius: 12px;
      padding: 25px;
      margin: 25px 0;
    }
    .recommendations h4 {
      color: #166534;
      margin-bottom: 15px;
      font-weight: 700;
      font-size: 18px;
    }
    .recommendations ul {
      margin-left: 20px;
      color: #15803d;
    }
    .recommendations li {
      margin: 10px 0;
      line-height: 1.7;
      font-weight: 500;
    }
    .footer {
      background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
      color: white;
      padding: 40px;
      text-align: center;
      border-top: 4px solid #3b82f6;
    }
    .footer p {
      margin: 8px 0;
      opacity: 0.9;
    }
    .footer strong {
      font-size: 16px;
      opacity: 1;
    }
    .confidence-bar {
      width: 100%;
      height: 40px;
      background: #e5e7eb;
      border-radius: 20px;
      overflow: hidden;
      margin: 25px 0;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .confidence-fill {
      height: 100%;
      background: linear-gradient(90deg, ${statusColor} 0%, ${statusColor}dd 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 700;
      font-size: 16px;
      transition: width 0.3s ease;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }
    .chain-of-custody {
      background: #f9fafb;
      border: 2px solid #d1d5db;
      border-radius: 10px;
      padding: 20px;
      margin: 20px 0;
    }
    .chain-of-custody table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    }
    .chain-of-custody th {
      background: #3b82f6;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      font-size: 13px;
    }
    .chain-of-custody td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 14px;
    }
    .chain-of-custody tr:hover {
      background: #f3f4f6;
    }
    .technical-details {
      background: #f9fafb;
      border-radius: 10px;
      padding: 20px;
      margin: 20px 0;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      border: 1px solid #d1d5db;
    }
    .technical-details code {
      color: #1e40af;
      font-weight: 600;
    }
    .page-break {
      page-break-before: always;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>DIGITAL FORENSICS ANALYSIS REPORT</h1>
      <p class="subtitle">Comprehensive Image Authenticity & Tampering Detection</p>
      <div class="report-id">Report ID: ${data.id}</div>
    </div>
    
    <div class="content">
      <!-- Executive Summary -->
      <div class="section">
        <div class="executive-summary">
          <h3>Executive Summary</h3>
          <p style="font-size: 16px; line-height: 1.8; color: #1e3a8a; margin-bottom: 15px;">
            This comprehensive digital forensics analysis report presents the findings of an in-depth examination 
            of digital evidence file <strong>${data.evidenceName}</strong>. The analysis employed advanced 
            computer vision algorithms, metadata forensics, compression artifact analysis, and AI-powered 
            detection systems to assess the authenticity and integrity of the submitted evidence.
          </p>
          <div style="margin-top: 20px;">
            <div class="status-badge">
              ${statusIcon} VERDICT: ${data.status.toUpperCase()}
            </div>
            <span class="risk-badge">Risk Level: ${riskLevel}</span>
          </div>
          <div class="confidence-bar" style="margin-top: 20px;">
            <div class="confidence-fill" style="width: ${data.confidence}%">
              Analysis Confidence: ${data.confidence.toFixed(1)}%
            </div>
          </div>
          <p style="margin-top: 20px; font-size: 14px; color: #475569; line-height: 1.7;">
            ${data.status === "authentic" 
              ? `The digital evidence has been examined using multiple forensic techniques and shows <strong>no significant indicators of tampering or manipulation</strong>. The image exhibits consistent pixel patterns, valid metadata structures, and normal compression characteristics consistent with authentic digital photography.`
              : `The digital evidence analysis has identified <strong>multiple indicators suggesting potential tampering or manipulation</strong>. Inconsistencies were detected across pixel-level analysis, metadata examination, and compression artifact patterns. Further investigation is recommended.`
            }
          </p>
        </div>
      </div>

      <!-- Evidence Information -->
      <div class="section">
        <h2 class="section-title">1. Evidence Information</h2>
        <div class="image-container">
          <img src="${data.imageData}" alt="${data.evidenceName}" />
          <p style="margin-top: 15px; color: #6b7280; font-weight: 600;">Evidence File: ${data.evidenceName}</p>
        </div>
        <div class="info-grid">
          <div class="info-item">
            <label>Evidence File Name</label>
            <value>${data.evidenceName}</value>
          </div>
          <div class="info-item">
            <label>Report Generation Date</label>
            <value>${formattedDate}</value>
          </div>
          <div class="info-item">
            <label>Forensic Analyst</label>
            <value>${data.generatedBy.name}</value>
          </div>
          <div class="info-item">
            <label>Analyst Contact</label>
            <value>${data.generatedBy.email}</value>
          </div>
        </div>
      </div>

      <!-- Methodology -->
      <div class="section">
        <h2 class="section-title">2. Analysis Methodology</h2>
        <div class="methodology">
          <h4>Forensic Analysis Techniques Applied</h4>
          <ul>
            <li><strong>Pixel-Level Analysis:</strong> Advanced computer vision algorithms examine pixel patterns, edge consistency, and statistical anomalies that may indicate digital manipulation or compositing.</li>
            <li><strong>Metadata Forensics:</strong> Comprehensive examination of EXIF data, file structure, timestamps, and embedded information to verify authenticity and detect inconsistencies.</li>
            <li><strong>Compression Artifact Analysis:</strong> Evaluation of JPEG/PNG compression patterns, quantization tables, and re-compression artifacts that may reveal editing history.</li>
            <li><strong>AI-Powered Detection:</strong> Machine learning models analyze deepfake probability, AI-generated content indicators, image quality metrics, and scammer detection patterns.</li>
            <li><strong>Statistical Analysis:</strong> Multi-dimensional statistical evaluation combining all detection methods to provide comprehensive authenticity assessment.</li>
          </ul>
        </div>
      </div>

      ${data.analysis ? `
      <!-- Detailed Analysis Results -->
      <div class="section">
        <h2 class="section-title">3. Detailed Forensic Analysis</h2>
        
        <h3 class="subsection-title">3.1 Overall Assessment Score</h3>
        <div class="analysis-scores">
          <div class="score-card" style="background: linear-gradient(135deg, ${pixelAnalysis?.color || '#6366f1'} 0%, ${pixelAnalysis?.color || '#8b5cf6'}dd 100%);">
            <label>Pixel-Level Analysis</label>
            <value>${data.analysis.pixelAnalysis.toFixed(1)}%</value>
            <div class="interpretation">${pixelAnalysis?.level || 'N/A'} - ${pixelAnalysis?.desc || ''}</div>
          </div>
          <div class="score-card" style="background: linear-gradient(135deg, ${metadataAnalysis?.color || '#6366f1'} 0%, ${metadataAnalysis?.color || '#8b5cf6'}dd 100%);">
            <label>Metadata Analysis</label>
            <value>${data.analysis.metadataAnalysis.toFixed(1)}%</value>
            <div class="interpretation">${metadataAnalysis?.level || 'N/A'} - ${metadataAnalysis?.desc || ''}</div>
          </div>
          <div class="score-card" style="background: linear-gradient(135deg, ${compressionAnalysis?.color || '#6366f1'} 0%, ${compressionAnalysis?.color || '#8b5cf6'}dd 100%);">
            <label>Compression Analysis</label>
            <value>${data.analysis.compressionAnalysis.toFixed(1)}%</value>
            <div class="interpretation">${compressionAnalysis?.level || 'N/A'} - ${compressionAnalysis?.desc || ''}</div>
          </div>
          <div class="score-card" style="background: linear-gradient(135deg, ${statusColor} 0%, ${statusColor}dd 100%);">
            <label>Overall Authenticity Score</label>
            <value>${data.analysis.overallScore.toFixed(1)}%</value>
            <div class="interpretation">${data.status === "authentic" ? "Authentic" : "Tampering Detected"}</div>
          </div>
        </div>

        <div class="detailed-analysis">
          <h3 class="subsection-title">3.2 Analysis Breakdown</h3>
          
          <div class="analysis-item">
            <h4>Pixel-Level Forensic Examination</h4>
            <p><strong>Score: ${data.analysis.pixelAnalysis.toFixed(1)}%</strong> | <strong>Status: ${pixelAnalysis?.level || 'N/A'}</strong></p>
            <p>
              ${data.analysis.pixelAnalysis >= 90 
                ? "The pixel-level analysis reveals consistent patterns throughout the image with no detectable anomalies. Pixel distribution, edge detection, and statistical analysis all indicate authentic digital capture without signs of manipulation or compositing."
                : data.analysis.pixelAnalysis >= 75
                ? "Pixel analysis shows minor inconsistencies that may be attributed to normal image processing or compression artifacts. No significant tampering indicators were detected at the pixel level."
                : data.analysis.pixelAnalysis >= 60
                ? "The pixel-level examination identified some inconsistencies in pixel patterns and edge characteristics. These anomalies may indicate localized editing or manipulation, requiring further investigation."
                : "Critical anomalies detected in pixel-level analysis. Inconsistent pixel patterns, edge artifacts, and statistical deviations strongly suggest digital manipulation or compositing has occurred."
              }
            </p>
          </div>

          <div class="analysis-item">
            <h4>Metadata Forensics Examination</h4>
            <p><strong>Score: ${data.analysis.metadataAnalysis.toFixed(1)}%</strong> | <strong>Status: ${metadataAnalysis?.level || 'N/A'}</strong></p>
            <p>
              ${data.analysis.metadataAnalysis >= 90
                ? "Metadata examination confirms valid EXIF data structure with consistent timestamps, camera information, and file attributes. No evidence of metadata tampering or inconsistencies detected."
                : data.analysis.metadataAnalysis >= 75
                ? "Metadata analysis shows mostly consistent information with minor discrepancies that may be attributed to file conversion or standard processing operations."
                : data.analysis.metadataAnalysis >= 60
                ? "Metadata examination revealed inconsistencies in timestamps, camera information, or file attributes that may indicate manipulation or file editing history."
                : "Severe metadata inconsistencies detected. Missing, corrupted, or contradictory metadata information strongly suggests the file has been modified or reconstructed."
              }
            </p>
          </div>

          <div class="analysis-item">
            <h4>Compression Artifact Analysis</h4>
            <p><strong>Score: ${data.analysis.compressionAnalysis.toFixed(1)}%</strong> | <strong>Status: ${compressionAnalysis?.level || 'N/A'}</strong></p>
            <p>
              ${data.analysis.compressionAnalysis >= 90
                ? "Compression analysis indicates normal, consistent compression patterns consistent with original image capture. No evidence of re-compression artifacts or editing history detected."
                : data.analysis.compressionAnalysis >= 75
                ? "Compression patterns show minor variations that may indicate file conversion or standard image processing, but no clear signs of malicious manipulation."
                : data.analysis.compressionAnalysis >= 60
                ? "Compression artifact analysis detected inconsistencies in quantization tables and compression patterns that may indicate the image has been edited and re-saved."
                : "Critical compression anomalies detected. Multiple compression signatures, inconsistent quantization tables, and re-compression artifacts strongly indicate the image has been edited and saved multiple times."
              }
            </p>
          </div>
        </div>
      </div>
      ` : ''}

      ${data.metadata ? `
      <!-- Metadata Examination -->
      <div class="section">
        <h2 class="section-title">4. Metadata & EXIF Data Examination</h2>
        <div class="info-grid">
          ${data.metadata.camera ? `
          <div class="info-item">
            <label>Camera/Device Model</label>
            <value>${data.metadata.camera}</value>
          </div>
          ` : ''}
          ${data.metadata.date ? `
          <div class="info-item">
            <label>Date & Time Captured</label>
            <value>${data.metadata.date}</value>
          </div>
          ` : ''}
          ${data.metadata.location ? `
          <div class="info-item">
            <label>Geographic Location</label>
            <value>${data.metadata.location}</value>
          </div>
          ` : ''}
          ${data.metadata.software ? `
          <div class="info-item">
            <label>Processing Software</label>
            <value>${data.metadata.software}</value>
          </div>
          ` : ''}
        </div>
        <div class="technical-details" style="margin-top: 20px;">
          <p><strong>Metadata Analysis Notes:</strong></p>
          <p>${data.metadata.software 
            ? `⚠️ <code>Processing software detected:</code> The presence of "${data.metadata.software}" in metadata suggests the image may have been processed or edited using image manipulation software. This does not necessarily indicate tampering but warrants additional scrutiny.`
            : data.metadata.camera && data.metadata.date
            ? `✓ <code>Metadata consistency:</code> Camera information and timestamp data are present and consistent. No obvious signs of metadata tampering detected.`
            : `⚠️ <code>Limited metadata:</code> Some expected metadata fields are missing or unavailable. This may indicate file conversion, editing, or metadata stripping.`
          }</p>
        </div>
      </div>
      ` : ''}

      ${data.anomalies && data.anomalies.length > 0 ? `
      <!-- Anomalies Detection -->
      <div class="section">
        <h2 class="section-title">5. Detected Anomalies & Risk Indicators</h2>
        <div class="anomalies">
          <h3>⚠️ Critical Findings: Tampering Indicators Detected</h3>
          <p style="margin-bottom: 15px; color: #991b1b; font-weight: 600;">
            The following anomalies and inconsistencies were identified during the forensic examination:
          </p>
          <ul>
            ${data.anomalies.map(anomaly => `<li><strong>Finding:</strong> ${anomaly}</li>`).join('')}
          </ul>
          <p style="margin-top: 20px; padding: 15px; background: white; border-radius: 6px; color: #7f1d1d; font-size: 14px; line-height: 1.7;">
            <strong>Risk Assessment:</strong> The presence of ${data.anomalies.length} ${data.anomalies.length === 1 ? 'anomaly' : 'anomalies'} 
            ${data.anomalies.length === 1 ? 'indicates' : 'indicate'} potential digital manipulation. These findings suggest the image may have been 
            altered, composited, or processed in ways that compromise its authenticity. Further investigation and expert review are recommended 
            before using this evidence in legal or official proceedings.
          </p>
        </div>
      </div>
      ` : `
      <!-- No Anomalies -->
      <div class="section">
        <h2 class="section-title">5. Anomaly Detection Results</h2>
        <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid #22c55e; border-radius: 12px; padding: 25px; text-align: center;">
          <h3 style="color: #166534; margin-bottom: 15px; font-size: 20px;">✓ No Anomalies Detected</h3>
          <p style="color: #15803d; font-size: 16px; line-height: 1.7;">
            Comprehensive anomaly detection analysis completed. No significant inconsistencies, tampering indicators, or suspicious patterns 
            were identified during the forensic examination. The image exhibits characteristics consistent with authentic digital capture.
          </p>
        </div>
      </div>
      `}

      ${data.aiDetection ? `
      <!-- AI-Powered Detection Analysis -->
      <div class="section">
        <h2 class="section-title">6. AI-Powered Detection Analysis</h2>
        <p style="margin-bottom: 25px; color: #4b5563; line-height: 1.8;">
          Advanced machine learning models were employed to detect synthetic content, deepfake manipulation, 
          AI-generated imagery, and other sophisticated tampering techniques that may not be detectable through 
          traditional forensic methods.
        </p>
        
        <div class="analysis-scores">
          <div class="score-card" style="background: ${data.aiDetection.deepfake > 0.5 ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)'};">
            <label>Deepfake Detection</label>
            <value>${(data.aiDetection.deepfake * 100).toFixed(1)}%</value>
            <div class="interpretation">${data.aiDetection.deepfake > 0.5 ? 'High Risk' : 'Low Risk'}</div>
          </div>
          <div class="score-card" style="background: ${data.aiDetection.aiGenerated > 0.5 ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)'};">
            <label>AI-Generated Content</label>
            <value>${(data.aiDetection.aiGenerated * 100).toFixed(1)}%</value>
            <div class="interpretation">${data.aiDetection.aiGenerated > 0.5 ? 'Synthetic Detected' : 'Authentic'}</div>
          </div>
          <div class="score-card" style="background: ${data.aiDetection.quality > 0.7 ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : data.aiDetection.quality > 0.4 ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'};">
            <label>Image Quality Index</label>
            <value>${(data.aiDetection.quality * 100).toFixed(1)}%</value>
            <div class="interpretation">${data.aiDetection.quality > 0.7 ? 'High Quality' : data.aiDetection.quality > 0.4 ? 'Moderate' : 'Low Quality'}</div>
          </div>
          <div class="score-card" style="background: ${data.aiDetection.scamProb > 0.5 ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)'};">
            <label>Fraud Risk Assessment</label>
            <value>${(data.aiDetection.scamProb * 100).toFixed(1)}%</value>
            <div class="interpretation">${data.aiDetection.scamProb > 0.5 ? 'High Risk' : 'Low Risk'}</div>
          </div>
        </div>

        <div class="detailed-analysis" style="margin-top: 30px;">
          <h3 class="subsection-title">6.1 Detailed AI Analysis Findings</h3>
          
          <div class="analysis-item">
            <h4>Deepfake Detection Analysis</h4>
            <p><strong>Probability: ${(data.aiDetection.deepfake * 100).toFixed(1)}%</strong></p>
            <p>
              ${data.aiDetection.deepfake > 0.5
                ? "⚠️ <strong>HIGH RISK:</strong> The AI detection system has identified a high probability that this image contains deepfake or face-swap manipulation. Facial features, lighting consistency, and biometric patterns show anomalies consistent with synthetic face generation or replacement techniques."
                : data.aiDetection.deepfake > 0.3
                ? "⚠️ <strong>MODERATE RISK:</strong> Some indicators of potential deepfake manipulation were detected. While not conclusive, facial analysis revealed minor inconsistencies that warrant further investigation."
                : "✓ <strong>LOW RISK:</strong> Deepfake detection analysis found no significant indicators of face-swap or deepfake manipulation. Facial features and biometric patterns appear consistent with authentic photography."
              }
            </p>
          </div>

          <div class="analysis-item">
            <h4>AI-Generated Content Detection</h4>
            <p><strong>Probability: ${(data.aiDetection.aiGenerated * 100).toFixed(1)}%</strong></p>
            <p>
              ${data.aiDetection.aiGenerated > 0.5
                ? "⚠️ <strong>Synthetic Content Detected:</strong> Analysis indicates this image was likely generated or significantly modified using AI image generation tools (e.g., DALL-E, Midjourney, Stable Diffusion). Characteristic patterns, texture inconsistencies, and generation artifacts were identified."
                : data.aiDetection.aiGenerated > 0.3
                ? "⚠️ <strong>Possible AI Processing:</strong> Some indicators suggest the image may have been processed or enhanced using AI tools, though definitive synthetic generation was not confirmed."
                : "✓ <strong>Authentic Content:</strong> No significant indicators of AI-generated content detected. The image exhibits characteristics consistent with authentic digital photography or legitimate image capture."
              }
            </p>
          </div>

          <div class="analysis-item">
            <h4>Image Quality Assessment</h4>
            <p><strong>Quality Index: ${(data.aiDetection.quality * 100).toFixed(1)}%</strong></p>
            <p>
              ${data.aiDetection.quality > 0.7
                ? "✓ <strong>High Quality:</strong> The image demonstrates excellent quality with clear resolution, proper exposure, and minimal compression artifacts. Quality metrics are consistent with professional or high-end consumer photography."
                : data.aiDetection.quality > 0.4
                ? "⚠️ <strong>Moderate Quality:</strong> Image quality is acceptable but shows some degradation, compression artifacts, or processing that may limit forensic analysis capabilities. Quality is sufficient for most examination purposes."
                : "⚠️ <strong>Low Quality:</strong> Significant quality issues detected including heavy compression, resolution limitations, or processing artifacts. These factors may impact the reliability of forensic analysis and should be considered when evaluating evidence."
              }
            </p>
          </div>

          <div class="analysis-item">
            <h4>Fraud & Scammer Risk Assessment</h4>
            <p><strong>Risk Probability: ${(data.aiDetection.scamProb * 100).toFixed(1)}%</strong></p>
            <p>
              ${data.aiDetection.scamProb > 0.5
                ? "⚠️ <strong>HIGH FRAUD RISK:</strong> The detection system has identified characteristics commonly associated with fraudulent or scam-related imagery. This may include profile photos used in social engineering, catfishing, or other deceptive practices. Exercise caution when evaluating the source and context of this image."
                : "✓ <strong>LOW FRAUD RISK:</strong> No significant indicators of fraudulent or scam-related usage patterns were detected. The image does not exhibit characteristics commonly associated with deceptive imagery."
              }
            </p>
          </div>
        </div>
      </div>
      ` : ''}

      <!-- Risk Assessment -->
      <div class="section">
        <h2 class="section-title">7. Risk Assessment & Classification</h2>
        <div style="background: ${riskColor}15; border: 2px solid ${riskColor}; border-radius: 12px; padding: 25px; margin: 20px 0;">
          <div style="display: flex; align-items: center; margin-bottom: 15px;">
            <h3 style="color: ${riskColor}; font-size: 22px; margin: 0; margin-right: 15px;">Risk Level: ${riskLevel}</h3>
            <span class="risk-badge" style="background: ${riskColor};">${riskLevel} RISK</span>
          </div>
          <p style="color: #374151; font-size: 15px; line-height: 1.8; margin-bottom: 15px;">
            <strong>Confidence Score: ${data.confidence.toFixed(1)}%</strong>
          </p>
          <p style="color: #4b5563; font-size: 14px; line-height: 1.7;">
            ${riskLevel === "LOW"
              ? "The evidence demonstrates high authenticity indicators with minimal risk factors. The image shows consistent forensic characteristics and can be considered reliable for evidentiary purposes with standard precautions."
              : riskLevel === "MEDIUM"
              ? "The evidence exhibits some inconsistencies or moderate risk indicators. While not definitively tampered, additional verification and expert review are recommended before relying on this evidence in critical applications."
              : "The evidence shows significant risk indicators and multiple anomalies suggesting potential tampering. This evidence should be treated with extreme caution and requires additional expert forensic examination before use in any legal or official capacity."
            }
          </p>
        </div>
      </div>

      <!-- Recommendations -->
      <div class="section">
        <h2 class="section-title">8. Recommendations & Next Steps</h2>
        <div class="recommendations">
          <h4>Forensic Analysis Recommendations</h4>
          <ul>
            ${data.status === "authentic"
              ? `
              <li>✓ The evidence appears authentic and can be used with standard evidentiary procedures.</li>
              <li>Maintain proper chain of custody documentation for all future handling of this evidence.</li>
              <li>Store the original file in a secure, tamper-evident location with backup copies.</li>
              <li>Document all access and modifications to the evidence file going forward.</li>
              `
              : `
              <li>⚠️ <strong>Immediate Action Required:</strong> Do not rely solely on this evidence without additional verification.</li>
              <li>Engage a certified digital forensics expert for independent analysis and validation.</li>
              <li>Obtain the original source file and compare with this evidence to identify discrepancies.</li>
              <li>Document all findings and maintain detailed records of the analysis process.</li>
              <li>Consider additional forensic techniques such as hash verification, blockchain timestamping, or expert witness testimony.</li>
              <li>If this evidence is critical, consider obtaining multiple independent forensic examinations.</li>
              `
            }
            ${data.aiDetection && (data.aiDetection.deepfake > 0.5 || data.aiDetection.aiGenerated > 0.5)
              ? `<li>⚠️ <strong>AI Manipulation Alert:</strong> High probability of AI-generated or deepfake content detected. Verify the source and context of this image through independent means.</li>`
              : ''
            }
            <li>Preserve all original files, metadata, and analysis reports for potential legal proceedings.</li>
            <li>Maintain documentation of the analysis methodology and tools used for transparency and reproducibility.</li>
          </ul>
        </div>
      </div>

      <!-- Chain of Custody -->
      <div class="section">
        <h2 class="section-title">9. Chain of Custody</h2>
        <div class="chain-of-custody">
          <p style="margin-bottom: 15px; color: #374151; font-weight: 600;">
            Evidence handling and analysis timeline:
          </p>
          <table>
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Action</th>
                <th>Performed By</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${formattedDate}</td>
                <td>Evidence Upload & Initial Analysis</td>
                <td>${data.generatedBy.name}</td>
                <td>Completed</td>
              </tr>
              <tr>
                <td>${formattedDate}</td>
                <td>Forensic Analysis & Report Generation</td>
                <td>${data.generatedBy.name}</td>
                <td>Completed</td>
              </tr>
              <tr>
                <td>${formattedDate}</td>
                <td>Report Finalization</td>
                <td>Digital Forensics System</td>
                <td>Completed</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Conclusion -->
      <div class="section">
        <h2 class="section-title">10. Final Conclusion</h2>
        <div style="background: ${data.status === "authentic" ? "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)" : "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)"}; border: 3px solid ${statusColor}; border-radius: 12px; padding: 30px; margin: 25px 0;">
          <h3 style="color: ${statusColor}; font-size: 22px; margin-bottom: 20px; font-weight: 700;">
            ${statusIcon} FINAL VERDICT: ${data.status.toUpperCase()}
          </h3>
          <p style="font-size: 16px; line-height: 1.9; color: #1f2937; margin-bottom: 15px;">
            ${data.status === "authentic" 
              ? `After comprehensive digital forensics analysis employing multiple detection methodologies, this evidence file 
              <strong>${data.evidenceName}</strong> has been determined to be <strong>AUTHENTIC</strong> with 
              <strong>${data.confidence.toFixed(1)}% confidence</strong>. The analysis examined pixel-level patterns, 
              metadata integrity, compression artifacts, and AI-powered detection systems. No significant indicators of 
              tampering, manipulation, or digital alteration were identified. The image exhibits characteristics consistent 
              with authentic digital capture and can be considered reliable for evidentiary purposes, subject to proper 
              chain of custody maintenance.`
              : `After comprehensive digital forensics analysis employing multiple detection methodologies, this evidence file 
              <strong>${data.evidenceName}</strong> has been flagged as showing <strong>SIGNS OF TAMPERING</strong> with 
              <strong>${data.confidence.toFixed(1)}% confidence</strong>. The analysis identified ${data.anomalies?.length || 0} 
              ${data.anomalies?.length === 1 ? 'anomaly' : 'anomalies'} and inconsistencies across multiple forensic examination 
              methods. These findings suggest the image may have been digitally altered, composited, or manipulated. 
              <strong>This evidence should not be relied upon without additional independent verification and expert review.</strong> 
              Further investigation is strongly recommended before using this evidence in any legal or official capacity.`
            }
          </p>
          <div style="margin-top: 25px; padding-top: 20px; border-top: 2px solid ${statusColor}40;">
            <p style="font-size: 14px; color: #475569; line-height: 1.7;">
              <strong>Analyst Certification:</strong> This report was prepared by ${data.generatedBy.name} (${data.generatedBy.email}) 
              using advanced digital forensics analysis tools and methodologies. The analysis was conducted in accordance with 
              standard digital evidence examination procedures.
            </p>
          </div>
        </div>
      </div>

      <!-- Technical Appendix -->
      <div class="section page-break">
        <h2 class="section-title">11. Technical Appendix</h2>
        <div class="technical-details">
          <p><strong>Report Technical Information:</strong></p>
          <p><code>Report ID:</code> ${data.id}</p>
          <p><code>Evidence File:</code> ${data.evidenceName}</p>
          <p><code>Analysis Date:</code> ${formattedDate}</p>
          <p><code>Analyst:</code> ${data.generatedBy.name} (${data.generatedBy.email})</p>
          <p><code>Analysis Confidence:</code> ${data.confidence.toFixed(2)}%</p>
          ${data.analysis ? `
          <p><code>Pixel Analysis Score:</code> ${data.analysis.pixelAnalysis.toFixed(2)}%</p>
          <p><code>Metadata Analysis Score:</code> ${data.analysis.metadataAnalysis.toFixed(2)}%</p>
          <p><code>Compression Analysis Score:</code> ${data.analysis.compressionAnalysis.toFixed(2)}%</p>
          <p><code>Overall Authenticity Score:</code> ${data.analysis.overallScore.toFixed(2)}%</p>
          ` : ''}
          ${data.aiDetection ? `
          <p><code>Deepfake Probability:</code> ${(data.aiDetection.deepfake * 100).toFixed(2)}%</p>
          <p><code>AI-Generated Probability:</code> ${(data.aiDetection.aiGenerated * 100).toFixed(2)}%</p>
          <p><code>Image Quality Index:</code> ${(data.aiDetection.quality * 100).toFixed(2)}%</p>
          <p><code>Fraud Risk Probability:</code> ${(data.aiDetection.scamProb * 100).toFixed(2)}%</p>
          ` : ''}
          <p style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #d1d5db;">
            <strong>Analysis Tools:</strong> Advanced computer vision algorithms, metadata forensics, compression artifact analysis, 
            AI-powered deepfake detection, statistical pattern recognition, and multi-dimensional authenticity assessment.
          </p>
        </div>
      </div>
    </div>

    <div class="footer">
      <p><strong>DIGITAL EVIDENCE VERIFICATION SYSTEM</strong></p>
      <p>Professional Digital Forensics & Image Authenticity Analysis</p>
      <p style="margin-top: 15px;">Report Generated: ${formattedDate}</p>
      <p style="margin-top: 10px; font-size: 12px; opacity: 0.8;">Report ID: ${data.id} | Confidential Forensic Analysis Document</p>
      <p style="margin-top: 15px; font-size: 11px; opacity: 0.7;">
        This report contains sensitive forensic analysis data. Distribution should be limited to authorized personnel only.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
};

export const downloadReport = (data: ReportData, format: "PDF" | "HTML" = "HTML") => {
  if (format === "HTML") {
    const htmlContent = generateHTMLReport(data);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${data.fileName.replace(/\.[^/.]+$/, "")}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else if (format === "PDF") {
    // For PDF, we'll use the browser's print functionality
    // In a production app, you'd use a library like jsPDF or html2pdf
    const htmlContent = generateHTMLReport(data);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 250);
      };
    }
  }
};

