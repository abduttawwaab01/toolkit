export type DocumentFormat = 'rich' | 'markdown' | 'text' | 'html' | 'visual';
export type DocumentExtension = 'html' | 'md' | 'txt' | 'pdf' | 'docx' | 'doc' | 'rtf' | 'odt' | 'image';

export type ImportSourceType = 'file-pdf' | 'file-docx' | 'file-doc' | 'file-rtf' | 'file-odt' | 'file-txt' | 'file-md' | 'file-html' | 'file-image';

export type VisualSourceType = 'pdf' | 'docx';

export interface VisualTextItem {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontName: string;
  fontWeight?: string;
  fontStyle?: string;
  transform: number[];
}

export interface VisualPage {
  pageNumber: number;
  width: number;
  height: number;
  textItems: VisualTextItem[];
  htmlContent?: string;
}

export interface VisualEdit {
  id: string;
  pageNumber: number;
  itemId: string;
  originalText: string;
  newText: string;
  timestamp: string;
}

export interface VisualDocumentData {
  originalBase64: string;
  sourceType: VisualSourceType;
  pageCount: number;
  pages: VisualPage[];
  edits: VisualEdit[];
  thumbnail?: string;
}

export interface Document {
  id: string;
  userId?: string;
  title: string;
  description?: string;
  content?: Record<string, unknown>; // TipTap JSON content (rich/text/html)
  format: DocumentFormat;
  mimeType?: string;
  extension?: DocumentExtension;
  size?: number; // bytes
  wordCount: number;
  isArchived?: boolean;
  isTemplate?: boolean;
  templateId?: string;
  tags?: string; // JSON string array
  metadata?: Record<string, unknown>;
  visualData?: VisualDocumentData; // For 'visual' format documents
  createdAt: string;
  updatedAt: string;
  lastOpenedAt?: string;
  versions?: DocumentVersion[];
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  content?: Record<string, unknown>;
  title: string;
  size?: number;
  wordCount?: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  content: Record<string, unknown>;
  format: DocumentFormat;
  thumbnail?: string;
  isPublic: boolean;
  usageCount: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ConvertOptions {
  fromFormat: DocumentFormat;
  toFormat: DocumentFormat;
  fromExtension: DocumentExtension;
  toExtension: DocumentExtension;
  content: string | Record<string, unknown>;
  title: string;
  preserveFormatting?: boolean;
}

export interface ConvertResult {
  success: boolean;
  content?: string;
  blob?: Blob;
  mimeType?: string;
  extension?: string;
  error?: string;
}

export interface DocumentStats {
  totalDocuments: number;
  totalSize: number;
  totalWords: number;
  byFormat: Record<DocumentFormat, number>;
  recentlyEdited: Document[];
}

export interface DocumentFilters {
  search?: string;
  format?: DocumentFormat;
  isArchived?: boolean;
  isTemplate?: boolean;
  sortBy?: 'title' | 'createdAt' | 'updatedAt' | 'size';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PaginatedDocuments {
  documents: Document[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
