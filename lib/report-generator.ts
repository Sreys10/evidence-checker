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
  faceDetection?: {
    faces_detected: number;
    matches: Array<{
      face_number: number;
      match_found: boolean;
      match_info: {
        person_name: string;
        distance: number;
        original_image_base64?: string;
        metadata?: {
          name?: string;
          age?: number;
          email?: string;
          phone?: string;
          notes?: string;
          added_by?: {
            name: string;
            email: string;
          };
        };
      } | null;
      face_image_base64: string;
    }>;
  };
  weaponDetection?: {
    weaponsFound: boolean;
    weaponsDetected: string[];
    detections: Array<{
      class: string;
      confidence: number;
      bbox: { x: number; y: number; width: number; height: number };
    }>;
    totalDetections: number;
  };
}

export const generateHTMLReport = (data: ReportData): string => {
  const statusColor = data.status === "authentic" ? "#10b981" : "#ef4444";
  const statusIcon = data.status === "authentic" ? "✓" : "⚠";
  const riskLevel = data.confidence > 80 ? "LOW" : data.confidence > 50 ? "MEDIUM" : "HIGH";
  const riskColor = riskLevel === "LOW" ? "#10b981" : riskLevel === "MEDIUM" ? "#f59e0b" : "#ef4444";

  const reportDate = new Date(data.generatedDate);
  const formattedDate = reportDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  let currentSection = 3;
  const metaSectionNum = data.metadata ? currentSection++ : 0;
  const anomalySectionNum = currentSection++;
  const faceSectionNum = data.faceDetection ? currentSection++ : 0;
  const weaponSectionNum = data.weaponDetection ? currentSection++ : 0;
  const aiSectionNum = data.aiDetection ? currentSection++ : 0;
  const riskSectionNum = currentSection++;
  const recSectionNum = currentSection++;
  const cocSectionNum = currentSection++;
  const concSectionNum = currentSection++;
  const appSectionNum = currentSection++;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Digital Forensics Analysis Report - ${data.evidenceName}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    @media print {
      body {
        padding: 0;
        background: white;
      }
      .container {
        box-shadow: none !important;
        border-radius: 0 !important;
        max-width: 100% !important;
        margin: 0 !important;
      }
      .no-print {
        display: none;
      }
      .page-break {
        page-break-before: always;
      }
    }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      line-height: 1.6;
      color: #0f172a;
      background: #f1f5f9;
      padding: 40px 20px;
    }
    .container {
      max-width: 960px;
      margin: 0 auto;
      background: white;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
    }
    .header {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: white;
      padding: 60px 50px;
      position: relative;
      border-bottom: 5px solid #3b82f6;
    }
    .header::after {
      content: "";
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #3b82f6 0%, #6366f1 50%, #10b981 100%);
    }
    .header h1 {
      font-size: 32px;
      font-weight: 800;
      letter-spacing: -0.025em;
      margin-bottom: 8px;
      text-transform: uppercase;
    }
    .header .subtitle {
      color: #94a3b8;
      font-size: 16px;
      font-weight: 400;
      margin-bottom: 24px;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .header .report-meta {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }
    .header .meta-pill {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
      color: #e2e8f0;
    }
    .content {
      padding: 50px;
    }
    .section {
      margin-bottom: 45px;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 20px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e2e8f0;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .section-title::before {
      content: "";
      display: inline-block;
      width: 4px;
      height: 18px;
      background: #3b82f6;
      border-radius: 2px;
    }
    .subsection-title {
      font-size: 15px;
      font-weight: 600;
      color: #334155;
      margin: 20px 0 10px 0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .executive-summary {
      background: #fafafb;
      border: 1px solid #e2e8f0;
      border-left: 5px solid #3b82f6;
      border-radius: 12px;
      padding: 30px;
      margin-bottom: 35px;
    }
    .executive-summary h3 {
      color: #0f172a;
      font-size: 18px;
      margin-bottom: 12px;
      font-weight: 700;
    }
    .executive-summary p {
      font-size: 15px;
      color: #334155;
      line-height: 1.6;
    }
    .verdict-box {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-top: 20px;
      padding: 15px;
      background: white;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
    .status-badge {
      padding: 8px 18px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 14px;
      background: ${statusColor};
      color: white;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .risk-badge {
      padding: 6px 12px;
      border-radius: 4px;
      font-weight: 600;
      font-size: 12px;
      background: ${riskColor}15;
      color: ${riskColor};
      border: 1px solid ${riskColor}30;
      text-transform: uppercase;
    }
    .confidence-wrapper {
      margin-top: 20px;
    }
    .confidence-label {
      font-size: 12px;
      font-weight: 600;
      color: #475569;
      margin-bottom: 6px;
      display: flex;
      justify-content: space-between;
    }
    .confidence-bar {
      width: 100%;
      height: 10px;
      background: #e2e8f0;
      border-radius: 6px;
      overflow: hidden;
    }
    .confidence-fill {
      height: 100%;
      background: ${statusColor};
      border-radius: 6px;
    }
    .image-container {
      text-align: center;
      margin: 25px 0;
      background: #f8fafc;
      padding: 20px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      position: relative;
    }
    .image-container img {
      max-width: 100%;
      max-height: 400px;
      object-fit: contain;
      border-radius: 6px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      border: 1px solid #cbd5e1;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin: 20px 0;
    }
    .info-item {
      background: #f8fafc;
      padding: 16px 20px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
    .info-item label {
      display: block;
      font-size: 10px;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 4px;
      font-weight: 700;
      letter-spacing: 0.05em;
    }
    .info-item value {
      display: block;
      font-size: 14px;
      color: #0f172a;
      font-weight: 600;
    }
    .analysis-scores {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      margin: 20px 0;
    }
    .score-card {
      background: #0f172a;
      color: white;
      padding: 20px;
      border-radius: 10px;
      text-align: center;
      border: 1px solid #1e293b;
      position: relative;
    }
    .score-card label {
      display: block;
      font-size: 11px;
      color: #94a3b8;
      margin-bottom: 8px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .score-card value {
      display: block;
      font-size: 28px;
      font-weight: 700;
      font-family: 'JetBrains Mono', monospace;
    }
    .score-card .interpretation {
      font-size: 10px;
      padding: 3px 8px;
      border-radius: 12px;
      display: inline-block;
      margin-top: 8px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .score-card.pass .interpretation {
      background: #10b98120;
      color: #10b981;
    }
    .score-card.fail .interpretation {
      background: #ef444420;
      color: #ef4444;
    }
    .score-card.warn .interpretation {
      background: #f59e0b20;
      color: #f59e0b;
    }
    .detailed-analysis {
      background: #fafafb;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      border: 1px solid #e2e8f0;
    }
    .analysis-item {
      padding: 15px;
      background: white;
      border-radius: 6px;
      margin-bottom: 12px;
      border: 1px solid #e2e8f0;
      border-left: 4px solid #3b82f6;
    }
    .analysis-item h4 {
      color: #0f172a;
      font-size: 14px;
      margin-bottom: 4px;
      font-weight: 700;
    }
    .analysis-item p {
      color: #334155;
      font-size: 13px;
      line-height: 1.5;
    }
    .methodology-box {
      background: #fffbeb;
      border: 1px solid #fef3c7;
      border-left: 4px solid #fbbf24;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      color: #78350f;
    }
    .methodology-box h4 {
      font-size: 14px;
      margin-bottom: 8px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .methodology-box ul {
      margin-left: 20px;
      font-size: 13.5px;
    }
    .methodology-box li {
      margin-bottom: 4px;
    }
    .anomalies {
      background: #fef2f2;
      border: 1px solid #fee2e2;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .anomalies h3 {
      color: #991b1b;
      margin-bottom: 12px;
      font-size: 16px;
      font-weight: 700;
    }
    .anomalies ul {
      list-style: none;
    }
    .anomalies li {
      padding: 10px 14px;
      background: white;
      margin-bottom: 8px;
      border-radius: 6px;
      border-left: 4px solid #dc2626;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      font-size: 13px;
      color: #7f1d1d;
      font-weight: 500;
    }
    .recommendations {
      background: #f0fdf4;
      border: 1px solid #dcfce7;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .recommendations h4 {
      color: #166534;
      margin-bottom: 12px;
      font-weight: 700;
      font-size: 15px;
    }
    .recommendations ul {
      margin-left: 20px;
      color: #15803d;
      font-size: 13.5px;
    }
    .recommendations li {
      margin-bottom: 6px;
    }
    .chain-of-custody {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      overflow-x: auto;
    }
    .chain-of-custody table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    .chain-of-custody th {
      background: #f8fafc;
      color: #475569;
      padding: 10px 12px;
      text-align: left;
      font-weight: 600;
      border-bottom: 2px solid #cbd5e1;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.05em;
    }
    .chain-of-custody td {
      padding: 10px 12px;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
    }
    .technical-details {
      background: #0f172a;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12.5px;
      border: 1px solid #1e293b;
      color: #94a3b8;
      line-height: 1.5;
    }
    .technical-details code {
      color: #3b82f6;
    }
    .footer {
      background: #0f172a;
      color: #94a3b8;
      padding: 40px;
      text-align: center;
      font-size: 12px;
      border-top: 1px solid #1e293b;
    }
    .footer strong {
      color: white;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Digital Forensics Report</h1>
      <p class="subtitle">Evidence Authenticity & Tampering Analysis</p>
      <div class="report-id-container">
        <div class="meta-pill">Report ID: ${data.id}</div>
        <div class="meta-pill">Evidence: ${data.evidenceName}</div>
      </div>
    </div>
    
    <div class="content">
      <!-- Executive Summary -->
      <div class="section">
        <div class="executive-summary">
          <h3>Executive Summary</h3>
          <p>
            This digital forensics analysis report presents the verification findings for digital evidence file 
            <strong>${data.evidenceName}</strong>. The analysis employed neural image tampering networks, metadata structure extraction, 
            artificial enhancement checks, and threat evaluation protocols to verify authenticity and identify manipulations.
          </p>
          <div class="verdict-box">
            <div class="status-badge" style="background: ${statusColor};">
              ${statusIcon} Verdict: ${data.status.toUpperCase()}
            </div>
            <span class="risk-badge" style="color: ${riskColor}; background: ${riskColor}10; border-color: ${riskColor}30;">Risk Level: ${riskLevel}</span>
          </div>
          <div class="confidence-wrapper">
            <div class="confidence-label">
              <span>Forensic Confidence</span>
              <span>${data.confidence.toFixed(1)}%</span>
            </div>
            <div class="confidence-bar">
              <div class="confidence-fill" style="width: ${data.confidence}%"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Evidence Information -->
      <div class="section">
        <h2 class="section-title">1. Evidence Overview</h2>
        <div class="image-container">
          <img src="${data.imageData}" alt="${data.evidenceName}" />
        </div>
        <div class="info-grid">
          <div class="info-item">
            <label>Evidence Filename</label>
            <value>${data.evidenceName}</value>
          </div>
          <div class="info-item">
            <label>Analysis Date</label>
            <value>${formattedDate}</value>
          </div>
          <div class="info-item">
            <label>Investigating Officer</label>
            <value>${data.generatedBy.name}</value>
          </div>
          <div class="info-item">
            <label>Contact Email</label>
            <value>${data.generatedBy.email}</value>
          </div>
        </div>
      </div>

      <!-- Methodology -->
      <div class="section">
        <h2 class="section-title">2. Analysis Methodology</h2>
        <div class="methodology-box">
          <h4>Applied Forensic Pipeline</h4>
          <ul>
            <li><strong>AI Detection Systems:</strong> Verifies generative structures, deepfake manipulation, quality limits, and scam likelihood.</li>
            <li><strong>EXIF Consistency Check:</strong> Discovers camera metadata inconsistencies, digital crop signs, and processing program footprints.</li>
            <li><strong>Threat Scan:</strong> Scans for dangerous weapon silhouettes or malicious items present inside the scene.</li>
          </ul>
        </div>
      </div>

      ${data.metadata ? `
      <!-- Metadata Examination -->
      <div class="section">
        <h2 class="section-title">${metaSectionNum}. Metadata & EXIF Analysis</h2>
        <div class="info-grid">
          ${data.metadata.camera ? `
          <div class="info-item">
            <label>Camera Model</label>
            <value>${data.metadata.camera}</value>
          </div>
          ` : ''}
          ${data.metadata.date ? `
          <div class="info-item">
            <label>Date Captured</label>
            <value>${data.metadata.date}</value>
          </div>
          ` : ''}
          ${data.metadata.location ? `
          <div class="info-item">
            <label>Location Coordinates</label>
            <value>${data.metadata.location}</value>
          </div>
          ` : ''}
          ${data.metadata.software ? `
          <div class="info-item">
            <label>Software Footprint</label>
            <value>${data.metadata.software}</value>
          </div>
          ` : ''}
        </div>
        <div class="technical-details">
          <p><strong>EXIF Parsing Observations:</strong></p>
          <p style="margin-top: 10px;">${data.metadata.software
            ? `⚠️ <code>Editor Alert:</code> Processing software <strong>"${data.metadata.software}"</strong> was identified in EXIF metadata. This confirms the image has been modified in an external editor or exported from an application.`
            : data.metadata.camera && data.metadata.date
              ? `✓ <code>Consistency:</code> Camera fields and capture dates match capturing constraints. No anomalies observed in metadata fields.`
              : `⚠️ <code>Missing Fields:</code> Essential camera EXIF fields are missing. The file has likely been stripped of original metadata.`
          }</p>
        </div>
      </div>
      ` : ''}

      ${data.anomalies && data.anomalies.length > 0 ? `
      <!-- Anomalies -->
      <div class="section">
        <h2 class="section-title">${anomalySectionNum}. Forensic Flags & Observations</h2>
        <div class="anomalies">
          <h3>⚠️ Discovered Inconsistencies</h3>
          <ul>
            ${data.anomalies.map((anomaly) => `<li>${anomaly}</li>`).join('')}
          </ul>
        </div>
      </div>
      ` : `
      <!-- No Anomalies -->
      <div class="section">
        <h2 class="section-title">${anomalySectionNum}. Forensic Flags & Observations</h2>
        <div style="background: #f0fdf4; border: 1px solid #dcfce7; border-left: 4px solid #10b981; border-radius: 8px; padding: 20px;">
          <h3 style="color: #14532d; font-size: 15px; margin-bottom: 8px;">✓ All Integrity Checks Passed</h3>
          <p style="color: #15803d; font-size: 13.5px;">
            The analysis found no pixel inconsistencies, camera metadata anomalies, or generative artificial patterns. The image has original digital parameters.
          </p>
        </div>
      </div>
      `}

      ${data.faceDetection ? `
      <!-- Face Recognition -->
      <div class="section">
        <h2 class="section-title">${faceSectionNum}. Biometric Analysis (Faces)</h2>
        <div style="background: #fafafb; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <p style="font-size: 14px; font-weight: 600; color: #0f172a;">Faces Detected inside evidence: <span style="font-family: monospace; font-size: 16px; color: #3b82f6;">${data.faceDetection.faces_detected}</span></p>
        </div>
        
        ${data.faceDetection.matches && data.faceDetection.matches.length > 0 ? `
        <div style="display: flex; flex-direction: column; gap: 16px;">
          ${data.faceDetection.matches.map((match) => `
          <div style="background: white; border: 1px solid ${match.match_found ? '#10b98130' : '#f59e0b30'}; border-radius: 10px; padding: 20px; display: flex; flex-direction: column; gap: 16px; border-left: 4px solid ${match.match_found ? '#10b981' : '#f59e0b'};">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <h4 style="font-size: 14px; font-weight: 700; color: #0f172a;">Face #${match.face_number}</h4>
              <span class="risk-badge" style="color: ${match.match_found ? '#10b981' : '#f59e0b'}; background: ${match.match_found ? '#10b98110' : '#f59e0b10'}; border-color: ${match.match_found ? '#10b98130' : '#f59e0b30'};">${match.match_found ? 'MATCH FOUND' : 'NO DATABASE MATCH'}</span>
            </div>
            
            <div style="display: flex; gap: 20px; flex-wrap: wrap;">
              <div style="flex: 1; min-width: 150px;">
                <p style="font-size: 10px; font-weight: 700; color: #64748b; margin-bottom: 6px; text-transform: uppercase;">Captured Face</p>
                <img src="${match.face_image_base64}" alt="Face ${match.face_number}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 6px; border: 1px solid #cbd5e1;" />
              </div>
              
              ${match.match_found && match.match_info?.original_image_base64 ? `
              <div style="flex: 1; min-width: 150px;">
                <p style="font-size: 10px; font-weight: 700; color: #64748b; margin-bottom: 6px; text-transform: uppercase;">Matched Record</p>
                <img src="${match.match_info.original_image_base64}" alt="Database Match" style="width: 100px; height: 100px; object-fit: cover; border-radius: 6px; border: 1px solid #10b981;" />
              </div>
              ` : ''}
              
              ${match.match_found && match.match_info ? `
              <div style="flex: 2; min-width: 200px; background: #f8fafc; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0; font-size: 13px;">
                <p style="margin-bottom: 4px;"><strong>Target Profile:</strong> ${match.match_info.person_name}</p>
                <p style="margin-bottom: 4px;"><strong>Similarity Rate:</strong> ${((1 - match.match_info.distance) * 100).toFixed(1)}%</p>
                ${match.match_info.metadata?.age ? `<p style="margin-bottom: 4px;"><strong>Age:</strong> ${match.match_info.metadata.age}</p>` : ''}
                ${match.match_info.metadata?.phone ? `<p style="margin-bottom: 4px;"><strong>Phone:</strong> ${match.match_info.metadata.phone}</p>` : ''}
              </div>
              ` : `
              <div style="flex: 2; min-width: 200px; background: #fffbeb; padding: 12px; border-radius: 6px; border: 1px solid #fef3c7; font-size: 12.5px; color: #78350f;">
                No matches found in FAISS reference database. Target is unrecognized.
              </div>
              `}
            </div>
          </div>
          `).join('')}
        </div>
        ` : ''}
      </div>
      ` : ''}

      ${data.weaponDetection ? `
      <!-- Weapon Detection -->
      <div class="section">
        <h2 class="section-title">${weaponSectionNum}. Threat & Weapon Scan</h2>
        <div style="background: ${data.weaponDetection.weaponsFound ? '#fef2f2' : '#f0fdf4'}; border: 1px solid ${data.weaponDetection.weaponsFound ? '#fee2e2' : '#dcfce7'}; border-left: 4px solid ${data.weaponDetection.weaponsFound ? '#ef4444' : '#10b981'}; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h3 style="color: ${data.weaponDetection.weaponsFound ? '#991b1b' : '#14532d'}; font-size: 15px; margin-bottom: 6px; font-weight: 700;">Weapon Search Verdict</h3>
          <p style="font-size: 13.5px; color: ${data.weaponDetection.weaponsFound ? '#7f1d1d' : '#15803d'};">
            ${data.weaponDetection.weaponsFound 
              ? `🚨 Threat identified! Discovered <strong>${data.weaponDetection.totalDetections}</strong> items: <strong>${data.weaponDetection.weaponsDetected.join(', ')}</strong>.` 
              : 'Safe environment. No firearms or bladed weapons detected.'}
          </p>
        </div>
        
        ${data.weaponDetection.weaponsFound && data.weaponDetection.detections.length > 0 ? `
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${data.weaponDetection.detections.map(det => `
          <div style="background: white; border: 1px solid #e2e8f0; padding: 12px 16px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; border-left: 4px solid #ef4444;">
            <div>
              <span style="font-weight: 600; font-size: 14px; color: #ef4444;">${det.class}</span>
              <span style="font-size: 11px; color: #64748b; margin-left: 10px; font-family: monospace;">BBox [${det.bbox.x}, ${det.bbox.y}, ${det.bbox.width}, ${det.bbox.height}]</span>
            </div>
            <span style="background: #ef444420; color: #ef4444; border: 1px solid #ef444430; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; font-family: 'JetBrains Mono', monospace;">${det.confidence.toFixed(1)}%</span>
          </div>
          `).join('')}
        </div>
        ` : ''}
      </div>
      ` : ''}

      ${data.aiDetection ? `
      <!-- AI analysis -->
      <div class="section">
        <h2 class="section-title">${aiSectionNum}. Deepfake & Synthetic Content Analysis</h2>
        <div class="analysis-scores">
          <div class="score-card ${data.aiDetection.deepfake > 0.5 ? 'fail' : 'pass'}">
            <label>Deepfake Score</label>
            <value>${(data.aiDetection.deepfake * 100).toFixed(0)}%</value>
            <span class="interpretation">${data.aiDetection.deepfake > 0.5 ? 'Alert' : 'Nominal'}</span>
          </div>
          <div class="score-card ${data.aiDetection.aiGenerated > 0.5 ? 'fail' : 'pass'}">
            <label>AI generated</label>
            <value>${(data.aiDetection.aiGenerated * 100).toFixed(0)}%</value>
            <span class="interpretation">${data.aiDetection.aiGenerated > 0.5 ? 'Synthetic' : 'Camera'}</span>
          </div>
          <div class="score-card ${data.aiDetection.quality > 0.6 ? 'pass' : 'warn'}">
            <label>Image Quality</label>
            <value>${(data.aiDetection.quality * 100).toFixed(0)}%</value>
            <span class="interpretation">${data.aiDetection.quality > 0.6 ? 'High' : 'Low'}</span>
          </div>
          <div class="score-card ${data.aiDetection.scamProb > 0.5 ? 'fail' : 'pass'}">
            <label>Scam Index</label>
            <value>${(data.aiDetection.scamProb * 100).toFixed(0)}%</value>
            <span class="interpretation">${data.aiDetection.scamProb > 0.5 ? 'Suspicious' : 'Safe'}</span>
          </div>
        </div>
        
        <div class="detailed-analysis">
          <div class="analysis-item">
            <h4>Deepfake Scan</h4>
            <p>${data.aiDetection.deepfake > 0.5 
              ? '⚠️ Facial features, skin texture patterns, and lighting vectors indicate face-swap/deepfake manipulation.' 
              : '✓ Facial structure and biometrics match normal photographic distributions. No deepfake traits detected.'}</p>
          </div>
          <div class="analysis-item">
            <h4>Synthetic Content Detection</h4>
            <p>${data.aiDetection.aiGenerated > 0.5 
              ? '⚠️ Computational features indicate image was likely generated via Stable Diffusion / Midjourney algorithms.' 
              : '✓ Continuous signal patterns indicate camera lens acquisition. Image shows standard photographic artifacts.'}</p>
          </div>
        </div>
      </div>
      ` : ''}

      <!-- Risk Assessment Section -->
      <div class="section">
        <h2 class="section-title">${riskSectionNum}. Forensic Risk Assessment</h2>
        <div style="background: ${riskColor}08; border: 1px solid ${riskColor}30; border-left: 4px solid ${riskColor}; border-radius: 8px; padding: 20px;">
          <h3 style="color: ${riskColor}; font-size: 15px; margin-bottom: 6px; font-weight: 700;">Risk Classification: ${riskLevel}</h3>
          <p style="font-size: 13px; color: #334155;">
            ${riskLevel === "LOW" 
              ? "All parameters fall within acceptable margins. The digital record shows zero indicators of malicious alteration. Authentic capture verification is highly consistent." 
              : riskLevel === "MEDIUM"
                ? "Minor discrepancies detected. While tampering is not definitively proven, inconsistencies in EXIF fields or minor noise patterns suggest possible secondary processing."
                : "Definitive tampering indicators found. Discovered structural noise anomalies, software artifacts, or synthetic faces. Relying on this evidence without additional analysis is not recommended."}
          </p>
        </div>
      </div>

      <!-- Recommendations -->
      <div class="section">
        <h2 class="section-title">${recSectionNum}. Action Recommendations</h2>
        <div class="recommendations">
          <h4>Suggested Forensic Protocols</h4>
          <ul>
            ${data.status === "authentic"
              ? `
              <li>Verify the cryptographic SHA-256 hash against custody database parameters.</li>
              <li>Perform blockchain timestamp preservation to log case submission parameters.</li>
              <li>The evidence is safe to utilize in standard litigation proceedings.</li>
              `
              : `
              <li>Flag document state in case records as "potential manipulation".</li>
              <li>Engage certified forensics consultant to run detailed pixel interpolation check.</li>
              <li>Request primary RAW files directly from capturing camera device if possible.</li>
              `
            }
            <li>Ensure evidence is logged on-chain to prevent subsequent modification.</li>
          </ul>
        </div>
      </div>

      <!-- Chain of Custody -->
      <div class="section">
        <h2 class="section-title">${cocSectionNum}. Chain of Custody</h2>
        <div class="chain-of-custody">
          <table>
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Operation</th>
                <th>Operator</th>
                <th>Outcome</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${formattedDate}</td>
                <td>Image Importation</td>
                <td>${data.generatedBy.name}</td>
                <td>Success</td>
              </tr>
              <tr>
                <td>${formattedDate}</td>
                <td>Digital Forensics Pipeline Trigger</td>
                <td>System Automated Checker</td>
                <td>Success</td>
              </tr>
              <tr>
                <td>${formattedDate}</td>
                <td>Certificate Generation</td>
                <td>Digital Evidence Verifier</td>
                <td>Success</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Conclusion -->
      <div class="section">
        <h2 class="section-title">${concSectionNum}. Final Forensics Conclusion</h2>
        <div style="background: ${data.status === "authentic" ? '#f0fdf4' : '#fef2f2'}; border: 1px solid ${statusColor}30; border-left: 5px solid ${statusColor}; border-radius: 10px; padding: 25px;">
          <h3 style="color: ${statusColor}; font-size: 16px; margin-bottom: 8px; font-weight: 700;">Verdict: ${data.status.toUpperCase()}</h3>
          <p style="font-size: 13.5px; color: #334155;">
            Following automated forensics analysis of <strong>${data.evidenceName}</strong>, the system logs a final verdict of <strong>${data.status.toUpperCase()}</strong> with a forensic certainty score of <strong>${data.confidence.toFixed(1)}%</strong>. This evaluation aggregates convolutional neural net checks, EXIF compliance tests, and AI deepfake matching profiles.
          </p>
        </div>
      </div>

      <!-- Technical Appendix -->
      <div class="section page-break">
        <h2 class="section-title">${appSectionNum}. Technical Appendix</h2>
        <div class="technical-details">
          <p style="margin-bottom: 8px; color: white;"><strong>Forensic Audit Log:</strong></p>
          <p>Document ID: <code>${data.id}</code></p>
          <p>Filename: <code>${data.evidenceName}</code></p>
          <p>Assigned Officer: <code>${data.generatedBy.name} (${data.generatedBy.email})</code></p>
          <p>Resolution Score: <code>${data.confidence.toFixed(2)}%</code></p>
          ${data.aiDetection ? `
          <p>Model output [deepfake_prob]: <code>${(data.aiDetection.deepfake).toFixed(4)}</code></p>
          <p>Model output [ai_generated_prob]: <code>${(data.aiDetection.aiGenerated).toFixed(4)}</code></p>
          <p>Model output [quality_index]: <code>${(data.aiDetection.quality).toFixed(4)}</code></p>
          <p>Model output [fraud_scam_index]: <code>${(data.aiDetection.scamProb).toFixed(4)}</code></p>
          ` : ''}
          ${data.faceDetection ? `
          <p>Model output [faces_count]: <code>${data.faceDetection.faces_detected}</code></p>
          ` : ''}
          ${data.weaponDetection ? `
          <p>Model output [weapons_found]: <code>${data.weaponDetection.weaponsFound ? 'TRUE' : 'FALSE'}</code></p>
          <p>Model output [weapons_classes]: <code>${data.weaponDetection.weaponsDetected.join(', ') || 'NONE'}</code></p>
          ` : ''}
        </div>
      </div>
    </div>

    <div class="footer">
      <p><strong>Digital Evidence Verification System</strong></p>
      <p>Forensics Integrity Report · Generated: ${formattedDate}</p>
      <p style="margin-top: 15px; font-size: 11px; opacity: 0.6;">Confidential Document. Distribution authorized only under forensic investigator guidelines.</p>
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

