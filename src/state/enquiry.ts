import { create } from 'zustand';

export type EnquiryPath = 'project' | 'partner';

interface EnquiryState {
  path: EnquiryPath;
  /** Attach the visitor's configuration to the project enquiry. */
  withConfiguration: boolean;
  /** Product whose catalogue is being requested, or null when the dialog is closed. */
  catalogue: string | null;
  setPath: (path: EnquiryPath) => void;
  setWithConfiguration: (v: boolean) => void;
  openCatalogue: (product: string) => void;
  closeCatalogue: () => void;
}

export const useEnquiry = create<EnquiryState>((set) => ({
  path: 'project',
  withConfiguration: false,
  catalogue: null,
  setPath: (path) => set({ path }),
  setWithConfiguration: (withConfiguration) => set({ withConfiguration }),
  openCatalogue: (catalogue) => set({ catalogue }),
  closeCatalogue: () => set({ catalogue: null }),
}));
