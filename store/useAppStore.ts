import { create } from 'zustand';

interface AppState {
  status: 'idle' | 'loading-model' | 'processing' | 'reviewing' | 'completed' | 'error';
  progress: number;
  logs: string[]; // This fixes the AuditLog error
  redactedPdfUrl: string | null;
  isDrawMode: boolean;
  draftBoxes: Array<{ id: string; x: number; y: number; w: number; h: number; page: number; text?: string; category?: string; isActive?: boolean }>;

  setStatus: (status: AppState['status']) => void;
  toggleDrawMode: () => void;
  setProgress: (p: number) => void;
  addLog: (log: string) => void;
  setRedactedPdfUrl: (url: string | null) => void;
  setDraftBoxes: (boxes: any[]) => void;
  addBox: (box: Omit<AppState['draftBoxes'][0], 'id'>) => void;
  removeBox: (id: string) => void;
  toggleBox: (id: string) => void;
  toggleCategory: (category: string, isActive: boolean) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  status: 'idle',
  progress: 0,
  logs: [],
  redactedPdfUrl: null,
  isDrawMode: false,
  draftBoxes: [],

  setStatus: (status) => set({ status }),
  toggleDrawMode: () => set((state) => ({ isDrawMode: !state.isDrawMode })),
  setProgress: (progress) => set({ progress }),
  setRedactedPdfUrl: (redactedPdfUrl) => set({ redactedPdfUrl }),
  addLog: (log) => set((state) => ({ logs: [...state.logs, log] })),
  setDraftBoxes: (boxes) => set({ draftBoxes: boxes.map(b => ({ ...b, id: b.id || crypto.randomUUID(), isActive: b.isActive !== false })) }),
  addBox: (box) => set((state) => ({ draftBoxes: [...state.draftBoxes, { ...box, id: crypto.randomUUID(), isActive: true }] })),
  removeBox: (id) => set((state) => ({ draftBoxes: state.draftBoxes.filter((b) => b.id !== id) })),
  toggleBox: (id) => set((state) => ({ draftBoxes: state.draftBoxes.map(b => b.id === id ? { ...b, isActive: !b.isActive } : b) })),
  toggleCategory: (category, isActive) => set((state) => ({
    draftBoxes: state.draftBoxes.map(b => (b.category || (b.text ? 'Uncategorized' : 'Manual')) === category ? { ...b, isActive } : b)
  })),
  reset: () => set((state) => {
    if (state.redactedPdfUrl) URL.revokeObjectURL(state.redactedPdfUrl);
    return { status: 'idle', progress: 0, logs: [], redactedPdfUrl: null, draftBoxes: [], isDrawMode: false };
  }),
}));