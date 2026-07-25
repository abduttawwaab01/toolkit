import { create } from 'zustand';
import type { Document, DocumentFormat, DocumentVersion } from '@/types/document';

interface DocumentState {
  // Current document
  currentDocument: Document | null;
  isDirty: boolean;
  isSaving: boolean;
  lastSaved: string | null;

  // Editor state
  editorContent: Record<string, unknown> | null;
  rawContent: string;
  wordCount: number;
  charCount: number;

  // Versions
  versions: DocumentVersion[];
  currentVersion: number;

  // UI state
  showPreview: boolean;
  showExportDialog: boolean;
  showConvertDialog: boolean;
  activePanel: 'editor' | 'preview' | 'convert' | 'versions';
  zoom: number;

  // Actions
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
  reset: () => void;
}

const initialState = {
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
};

export const useDocumentStore = create<DocumentState>((set) => ({
  ...initialState,
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
  reset: () => set(initialState),
}));
