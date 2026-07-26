import { create } from 'zustand';
import type { Document, DocumentFormat, DocumentVersion, VisualDocumentData, VisualEdit } from '@/types/document';

const DOCUMENTS_KEY = 'toolkit-documents';
const VERSIONS_PREFIX = 'toolkit-versions-';

function loadFromStorage(): Document[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(DOCUMENTS_KEY) || '[]');
  } catch { return []; }
}

function saveToStorage(docs: Document[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(docs));
}

function loadVersions(docId: string): DocumentVersion[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(VERSIONS_PREFIX + docId) || '[]');
  } catch { return []; }
}

function saveVersions(docId: string, versions: DocumentVersion[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(VERSIONS_PREFIX + docId, JSON.stringify(versions));
}

interface DocumentState {
  documents: Document[];
  currentDocument: Document | null;
  isDirty: boolean;
  isSaving: boolean;
  lastSaved: string | null;
  editorContent: Record<string, unknown> | null;
  rawContent: string;
  wordCount: number;
  charCount: number;
  versions: DocumentVersion[];
  currentVersion: number;
  showPreview: boolean;
  showExportDialog: boolean;
  showConvertDialog: boolean;
  activePanel: 'editor' | 'preview' | 'convert' | 'versions';
  zoom: number;
  searchQuery: string;

  loadDocuments: () => void;
  createDocument: (data: { title: string; description?: string; format: DocumentFormat; tags?: string[] }) => Document;
  createVisualDocument: (data: { title: string; description?: string; format: 'visual'; visualData: VisualDocumentData; tags?: string[] }) => Document;
  saveCurrentDocument: () => void;
  deleteDocument: (id: string) => void;
  addVersion: () => DocumentVersion;
  setCurrentDocument: (doc: Document | null) => void;
  setEditorContent: (content: Record<string, unknown>) => void;
  setRawContent: (content: string) => void;
  setIsDirty: (dirty: boolean) => void;
  setIsSaving: (saving: boolean) => void;
  setLastSaved: (time: string) => void;
  setWordCount: (count: number) => void;
  setCharCount: (count: number) => void;
  setVersions: (versions: DocumentVersion[]) => void;
  setCurrentVersion: (version: number) => void;
  setShowPreview: (show: boolean) => void;
  setShowExportDialog: (show: boolean) => void;
  setShowConvertDialog: (show: boolean) => void;
  setActivePanel: (panel: 'editor' | 'preview' | 'convert' | 'versions') => void;
  setZoom: (zoom: number) => void;
  setSearchQuery: (q: string) => void;
  setVisualData: (data: VisualDocumentData) => void;
  addVisualEdit: (edit: VisualEdit) => void;
  reset: () => void;
}

const initialState = {
  documents: [],
  currentDocument: null,
  isDirty: false,
  isSaving: false,
  lastSaved: null,
  editorContent: null,
  rawContent: '',
  wordCount: 0,
  charCount: 0,
  versions: [],
  currentVersion: 1,
  showPreview: false,
  showExportDialog: false,
  showConvertDialog: false,
  activePanel: 'editor' as const,
  zoom: 100,
  searchQuery: '',
};

function computeSize(content: string): number {
  return new TextEncoder().encode(content).length;
}

function computeWordCount(content: string): number {
  return content.trim() ? content.trim().split(/\s+/).length : 0;
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  ...initialState,

  loadDocuments: () => {
    const docs = loadFromStorage();
    set({ documents: docs });
  },

  createDocument: (data) => {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    const defaultContent: Record<string, unknown> = {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }],
    };
    const contentStr = JSON.stringify(defaultContent);
    const doc: Document = {
      id,
      title: data.title || 'Untitled',
      description: data.description,
      content: defaultContent,
      format: data.format || 'rich',
      wordCount: 0,
      size: computeSize(contentStr),
      isArchived: false,
      tags: JSON.stringify(data.tags || []),
      createdAt: now,
      updatedAt: now,
    };
    const docs = [...get().documents, doc];
    saveToStorage(docs);
    set({ documents: docs });
    return doc;
  },

  createVisualDocument: (data) => {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    const doc: Document = {
      id,
      title: data.title || 'Untitled',
      description: data.description,
      format: 'visual',
      wordCount: 0,
      size: 0,
      isArchived: false,
      tags: JSON.stringify(data.tags || []),
      visualData: data.visualData,
      createdAt: now,
      updatedAt: now,
    };
    const docs = [...get().documents, doc];
    saveToStorage(docs);
    set({ documents: docs, currentDocument: doc });
    return doc;
  },

  saveCurrentDocument: () => {
    const { currentDocument, editorContent, rawContent, wordCount, versions } = get();
    if (!currentDocument) return;
    const content = editorContent || currentDocument.content;
    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
    const size = computeSize(contentStr);
    const now = new Date().toISOString();
    const updated: Document = {
      ...currentDocument,
      content,
      size,
      wordCount: wordCount || computeWordCount(rawContent || contentStr),
      updatedAt: now,
    };
    // Auto-create version snapshots (every 5 saves or on significant changes)
    const maxVer = versions.reduce((max, v) => Math.max(max, v.version), 0);
    const version: DocumentVersion = {
      id: crypto.randomUUID(),
      documentId: currentDocument.id,
      version: maxVer + 1,
      content: content as Record<string, unknown>,
      title: currentDocument.title,
      size,
      wordCount: wordCount || computeWordCount(rawContent),
      createdAt: now,
    };
    const updatedVersions = [...versions, version];
    saveVersions(currentDocument.id, updatedVersions);
    const docs = get().documents.map((d) => (d.id === updated.id ? updated : d));
    saveToStorage(docs);
    set({ documents: docs, currentDocument: updated, isDirty: false, isSaving: false, lastSaved: now, versions: updatedVersions, currentVersion: version.version });
  },

  deleteDocument: (id) => {
    const docs = get().documents.filter((d) => d.id !== id);
    saveToStorage(docs);
    if (get().currentDocument?.id === id) {
      set({ documents: docs, currentDocument: null, versions: [], rawContent: '' });
    } else {
      set({ documents: docs });
    }
    localStorage.removeItem(VERSIONS_PREFIX + id);
  },

  addVersion: () => {
    const { currentDocument, editorContent, rawContent, wordCount, versions } = get();
    if (!currentDocument) throw new Error('No document open');
    const content = editorContent || currentDocument.content;
    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
    const size = computeSize(contentStr);
    const maxVer = versions.reduce((max, v) => Math.max(max, v.version), 0);
    const version: DocumentVersion = {
      id: crypto.randomUUID(),
      documentId: currentDocument.id,
      version: maxVer + 1,
      content: content as Record<string, unknown>,
      title: currentDocument.title,
      size,
      wordCount: wordCount || computeWordCount(rawContent),
      createdAt: new Date().toISOString(),
    };
    const updatedVersions = [...versions, version];
    saveVersions(currentDocument.id, updatedVersions);
    set({ versions: updatedVersions, currentVersion: version.version });
    return version;
  },

  setCurrentDocument: (doc) => set({ currentDocument: doc }),
  setEditorContent: (content) => set({ editorContent: content }),
  setRawContent: (content) => set({ rawContent: content }),
  setIsDirty: (dirty) => set({ isDirty: dirty }),
  setIsSaving: (saving) => set({ isSaving: saving }),
  setLastSaved: (time) => set({ lastSaved: time }),
  setWordCount: (count) => set({ wordCount: count }),
  setCharCount: (count) => set({ charCount: count }),
  setVersions: (versions) => set({ versions }),
  setCurrentVersion: (version) => set({ currentVersion: version }),
  setShowPreview: (show) => set({ showPreview: show }),
  setShowExportDialog: (show) => set({ showExportDialog: show }),
  setShowConvertDialog: (show) => set({ showConvertDialog: show }),
  setActivePanel: (panel) => set({ activePanel: panel }),
  setZoom: (zoom) => set({ zoom }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setVisualData: (data) => {
    const { currentDocument } = get();
    if (!currentDocument) return;
    const updated = { ...currentDocument, visualData: data };
    const docs = get().documents.map((d) => (d.id === updated.id ? updated : d));
    saveToStorage(docs);
    set({ currentDocument: updated, documents: docs, isDirty: true });
  },
  addVisualEdit: (edit) => {
    const { currentDocument } = get();
    if (!currentDocument || !currentDocument.visualData) return;
    const existing = currentDocument.visualData.edits.findIndex(
      (e) => e.itemId === edit.itemId && e.pageNumber === edit.pageNumber,
    );
    const newEdits = [...currentDocument.visualData.edits];
    if (existing >= 0) {
      newEdits[existing] = edit;
    } else {
      newEdits.push(edit);
    }
    const updatedVisualData = { ...currentDocument.visualData, edits: newEdits };
    const updated = { ...currentDocument, visualData: updatedVisualData };
    const docs = get().documents.map((d) => (d.id === updated.id ? updated : d));
    saveToStorage(docs);
    set({ currentDocument: updated, documents: docs, isDirty: true });
  },
  reset: () => set(initialState),
}));
