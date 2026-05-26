// Shared types for the Admin portal — imported by admin/page.tsx and components/admin/admin-tabs.tsx

export interface AdminUser {
  _id?: string;
  name: string;
  email: string;
  userType: "admin" | "analyst" | "verifier" | "guest";
  lastLogin?: string | Date;
  createdAt?: string | Date;
  status?: "online" | "offline";
}

export interface AdminNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  reportId?: string;
  reportData?: {
    fileName: string;
    evidenceName: string;
    status: "authentic" | "tampered";
    confidence: number;
    generatedDate: string;
    format?: "PDF" | "HTML";
    generatedBy?: { name: string; email: string };
  };
  fullReport?: {
    id: string;
    fileName: string;
    evidenceName: string;
    imageData: string;
    generatedDate: string;
    generatedBy: { name: string; email: string };
    status: "authentic" | "tampered";
    confidence: number;
    metadata?: { camera?: string; date?: string; location?: string; software?: string };
    anomalies?: string[];
  };
  timestamp: string;
  read: boolean;
}

export interface AdminFlaggedReport {
  id: string;
  reportId: string;
  evidenceName: string;
  status: "authentic" | "tampered";
  confidence: number;
  generatedBy: { name: string; email: string };
  flaggedAt: string;
  reason?: string;
  reportData?: any;
  fullReport?: any;
}
