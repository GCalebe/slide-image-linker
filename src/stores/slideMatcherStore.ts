import { create } from 'zustand';
import { toast } from '@/components/ui/use-toast';

interface Slide { url: string; meta: any[]; }
interface ImageElement { id: string; x: number; y: number; w: number; h: number; text?: string; }
interface ImageData { id: string; url: string; elements: ImageElement[]; }
interface Association { shapeId: string; imageId: string; }

interface SlideMatcherState {
  currentPptxId: string;
  slides: Slide[];
  currentSlideIndex: number;

  images: ImageData[];
  currentImageIndex: number;

  associations: Association[];
  isPanelOpen: boolean;

  uploadPptx: (file: File) => Promise<void>;
  loadSlidesFromBackend: (pptxId: string) => Promise<void>;
  uploadImage: (file: File) => Promise<void>;

  addAssociation: (shapeId: string, imageId: string) => void;
  removeAssociation: (shapeId: string, imageId: string) => void;
  importMappings: (data: Association[]) => void;
  exportMappings: () => void;
  generatePowerPoint: () => Promise<void>;

  togglePanel: () => void;
  setCurrentSlideIndex: (idx: number) => void;
  setCurrentImageIndex: (idx: number) => void;
}

const API_BASE = import.meta.env.VITE_API_BASE;

export const useSlideMatcherStore = create<SlideMatcherState>((set, get) => ({
  currentPptxId: '',
  slides: [],
  currentSlideIndex: 0,
  images: [],
  currentImageIndex: 0,
  associations: [],
  isPanelOpen: false,

  uploadPptx: async (file) => {
    try {
      const form = new FormData(); form.append('file', file);
      const res = await fetch(`${API_BASE}/api/upload-pptx`, { method: 'POST', body: form });
      if (!res.ok) throw new Error(await res.text());
      const { pptx_id } = await res.json();
      set({ currentPptxId: pptx_id });
      toast({ title: 'Upload realizado', description: 'PPTX enviado com sucesso' });
    } catch (error: any) {
      console.error('uploadPptx error', error);
      toast({ title: 'Erro', description: 'Falha ao enviar PPTX', variant: 'destructive' });
      throw error;
    }
  },

  loadSlidesFromBackend: async (pptxId) => {
    try {
      const count = 10; // TODO: obtain real count from backend
      const slides: Slide[] = [];
      for (let i = 1; i <= count; i++) {
        const res = await fetch(`${API_BASE}/api/slide/${pptxId}/${i}`);
        if (!res.ok) throw new Error(await res.text());
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const meta = JSON.parse(res.headers.get('X-Shape-Meta') || '[]');
        slides.push({ url, meta });
      }
      set({ slides, currentSlideIndex: 0 });
    } catch (error: any) {
      console.error('loadSlidesFromBackend error', error);
      toast({ title: 'Erro', description: 'Falha ao carregar slides', variant: 'destructive' });
      throw error;
    }
  },

  uploadImage: async (file) => {
    try {
      const form = new FormData(); form.append('file', file);
      const res1 = await fetch(`${API_BASE}/api/upload-image`, { method: 'POST', body: form });
      if (!res1.ok) throw new Error(await res1.text());
      const { img_id } = await res1.json();
      const res2 = await fetch(`${API_BASE}/api/image/${img_id}`);
      if (!res2.ok) throw new Error(await res2.text());
      const blob = await res2.blob();
      const url = URL.createObjectURL(blob);
      const boxes = JSON.parse(res2.headers.get('X-Box-Meta') || '[]');
      set(state => ({ images: [...state.images, { id: img_id, url, elements: boxes }] }));
      toast({ title: 'Imagem enviada', description: file.name });
    } catch (error: any) {
      console.error('uploadImage error', error);
      toast({ title: 'Erro', description: 'Falha ao enviar imagem', variant: 'destructive' });
      throw error;
    }
  },

  addAssociation: (shapeId, imageId) => set(state => ({ associations: [...state.associations, { shapeId, imageId }] })),
  removeAssociation: (shapeId, imageId) => set(state => ({ associations: state.associations.filter(a => !(a.shapeId === shapeId && a.imageId === imageId)) })),

  importMappings: (data) => set({ associations: data }),
  exportMappings: () => {
    try {
      const data = JSON.stringify(get().associations, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'mappings.json'; a.click();
      toast({ title: 'Exportação realizada', description: 'Mappings salvos' });
    } catch (error: any) {
      console.error('exportMappings error', error);
      toast({ title: 'Erro', description: 'Falha ao exportar mappings', variant: 'destructive' });
    }
  },

  generatePowerPoint: async () => {
    try {
      const { currentPptxId, associations } = get();
      if (!currentPptxId) throw new Error('Nenhum PPTX carregado');
      const res = await fetch(`${API_BASE}/api/apply-mappings/${currentPptxId}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(associations),
      });
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `${currentPptxId}_updated.pptx`; a.click();
      toast({ title: 'Sucesso', description: 'PPTX gerado' });
    } catch (error: any) {
      console.error('generatePowerPoint error', error);
      toast({ title: 'Erro', description: 'Falha ao gerar PPTX', variant: 'destructive' });
    }
  },

  togglePanel: () => set(state => ({ isPanelOpen: !state.isPanelOpen })),
  setCurrentSlideIndex: (idx) => set({ currentSlideIndex: idx }),
  setCurrentImageIndex: (idx) => set({ currentImageIndex: idx }),
}));
