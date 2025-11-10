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
}

export const generateHTMLReport = (data: ReportData): string => {
  const statusColor = data.status === "authentic" ? "#10b981" : "#ef4444";
  const statusIcon = data.status === "authentic" ? "✓" : "⚠";
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Evidence Verification Report - ${data.evidenceName}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: #f9fafb;
      padding: 20px;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      border-radius: 8px;
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    .header h1 {
      font-size: 32px;
      margin-bottom: 10px;
    }
    .header p {
      opacity: 0.9;
      font-size: 16px;
    }
    .content {
      padding: 40px;
    }
    .section {
      margin-bottom: 40px;
    }
    .section-title {
      font-size: 24px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e5e7eb;
    }
    .image-container {
      text-align: center;
      margin: 30px 0;
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
    }
    .image-container img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .status-badge {
      display: inline-block;
      padding: 12px 24px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 18px;
      background: ${statusColor};
      color: white;
      margin: 20px 0;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin: 20px 0;
    }
    .info-item {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #6366f1;
    }
    .info-item label {
      display: block;
      font-size: 12px;
      text-transform: uppercase;
      color: #6b7280;
      margin-bottom: 8px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    .info-item value {
      display: block;
      font-size: 18px;
      color: #1f2937;
      font-weight: 500;
    }
    .analysis-scores {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin: 20px 0;
    }
    .score-card {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: white;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }
    .score-card label {
      display: block;
      font-size: 12px;
      opacity: 0.9;
      margin-bottom: 8px;
    }
    .score-card value {
      display: block;
      font-size: 32px;
      font-weight: 700;
    }
    .anomalies {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .anomalies h3 {
      color: #dc2626;
      margin-bottom: 15px;
    }
    .anomalies ul {
      list-style: none;
      padding: 0;
    }
    .anomalies li {
      padding: 10px;
      background: white;
      margin: 8px 0;
      border-radius: 4px;
      border-left: 4px solid #dc2626;
    }
    .footer {
      background: #f9fafb;
      padding: 30px;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
      border-top: 1px solid #e5e7eb;
    }
    .confidence-bar {
      width: 100%;
      height: 30px;
      background: #e5e7eb;
      border-radius: 15px;
      overflow: hidden;
      margin: 20px 0;
    }
    .confidence-fill {
      height: 100%;
      background: linear-gradient(90deg, ${statusColor} 0%, ${statusColor}dd 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      transition: width 0.3s ease;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Evidence Verification Report</h1>
      <p>Digital Forensics & Tampering Detection Analysis</p>
    </div>
    
    <div class="content">
      <div class="section">
        <div class="status-badge">
          ${statusIcon} Status: ${data.status.toUpperCase()}
        </div>
        <div class="confidence-bar">
          <div class="confidence-fill" style="width: ${data.confidence}%">
            ${data.confidence.toFixed(1)}% Confidence
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Evidence Image</h2>
        <div class="image-container">
          <img src="${data.imageData}" alt="${data.evidenceName}" />
          <p style="margin-top: 15px; color: #6b7280;">${data.evidenceName}</p>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Report Information</h2>
        <div class="info-grid">
          <div class="info-item">
            <label>Evidence File</label>
            <value>${data.evidenceName}</value>
          </div>
          <div class="info-item">
            <label>Report Date</label>
            <value>${new Date(data.generatedDate).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</value>
          </div>
          <div class="info-item">
            <label>Generated By</label>
            <value>${data.generatedBy.name}</value>
          </div>
          <div class="info-item">
            <label>Analyst Email</label>
            <value>${data.generatedBy.email}</value>
          </div>
        </div>
      </div>

      ${data.analysis ? `
      <div class="section">
        <h2 class="section-title">Analysis Scores</h2>
        <div class="analysis-scores">
          <div class="score-card">
            <label>Pixel Analysis</label>
            <value>${data.analysis.pixelAnalysis}%</value>
          </div>
          <div class="score-card">
            <label>Metadata Analysis</label>
            <value>${data.analysis.metadataAnalysis}%</value>
          </div>
          <div class="score-card">
            <label>Compression Analysis</label>
            <value>${data.analysis.compressionAnalysis}%</value>
          </div>
          <div class="score-card">
            <label>Overall Score</label>
            <value>${data.analysis.overallScore.toFixed(1)}%</value>
          </div>
        </div>
      </div>
      ` : ''}

      ${data.metadata ? `
      <div class="section">
        <h2 class="section-title">Image Metadata</h2>
        <div class="info-grid">
          ${data.metadata.camera ? `
          <div class="info-item">
            <label>Camera</label>
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
            <label>Location</label>
            <value>${data.metadata.location}</value>
          </div>
          ` : ''}
          ${data.metadata.software ? `
          <div class="info-item">
            <label>Software</label>
            <value>${data.metadata.software}</value>
          </div>
          ` : ''}
        </div>
      </div>
      ` : ''}

      ${data.anomalies && data.anomalies.length > 0 ? `
      <div class="section">
        <h2 class="section-title">Detected Anomalies</h2>
        <div class="anomalies">
          <h3>⚠ Warning: Tampering Indicators Detected</h3>
          <ul>
            ${data.anomalies.map(anomaly => `<li>${anomaly}</li>`).join('')}
          </ul>
        </div>
      </div>
      ` : ''}

      <div class="section">
        <h2 class="section-title">Conclusion</h2>
        <div class="info-item" style="background: ${data.status === "authentic" ? "#f0fdf4" : "#fef2f2"}; border-left-color: ${statusColor};">
          <p style="font-size: 16px; line-height: 1.8;">
            ${data.status === "authentic" 
              ? `Based on comprehensive analysis, this evidence image appears to be <strong>authentic</strong> with ${data.confidence.toFixed(1)}% confidence. No significant tampering indicators were detected.`
              : `Based on comprehensive analysis, this evidence image shows <strong>signs of tampering</strong> with ${data.confidence.toFixed(1)}% confidence. Multiple anomalies and inconsistencies were detected that suggest the image may have been altered.`
            }
          </p>
        </div>
      </div>
    </div>

    <div class="footer">
      <p><strong>Digital Evidence Verification System</strong></p>
      <p>This report was generated automatically on ${new Date(data.generatedDate).toLocaleString()}</p>
      <p style="margin-top: 10px; font-size: 12px;">Report ID: ${data.id}</p>
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

