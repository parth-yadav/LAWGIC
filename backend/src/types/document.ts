// Types for document responses with signed URLs

export interface DocumentWithSignedUrl {
  id: string;
  userId: string;
  title: string;
  fileName: string;
  filePath: string;
  fileKey: string;
  pageCount: number;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  signedUrl: string | null; // Pre-signed URL for secure file access
  user?: {
    id: string;
    name: string | null;
    email: string;
  };
  _count?: {
    highlights: number;
    threats: number;
    complexTerms: number;
  };
}

export interface DocumentListResponse {
  success: boolean;
  data: DocumentWithSignedUrl[];
}

export interface DocumentDetailResponse {
  success: boolean;
  data: DocumentWithSignedUrl;
}
