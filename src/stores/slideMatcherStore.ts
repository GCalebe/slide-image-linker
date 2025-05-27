
import { create } from 'zustand';

export interface ShapeElement {
  id: string;
  slideIndex: number;
  coordinates: { x: number; y: number; width: number; height: number };
  type: 'shape' | 'textbox' | 'image';
  metadata?: string;
}

export interface ImageElement {
  id: string;
  imageIndex: number;
  coordinates: { x: number; y: number; width: number; height: number };
  type: 'text' | 'object';
  text?: string;
  confidence?: number;
}

export interface Association {
  shapeId: string;
  imageId: string;
  status: 'active' | 'pending' | 'error';
}

export interface SlideData {
  index: number;
  imageUrl: string;
  shapes: ShapeElement[];
}

export interface ImageData {
  index: number;
  file: File;
  url: string;
  elements: ImageElement[];
}

interface SlideMatcherState {
  // PowerPoint data
  slides: SlideData[];
  currentSlideIndex: number;
  selectedShapeId: string | null;
  
  // External images data
  images: ImageData[];
  currentImageIndex: number;
  selectedImageElementId: string | null;
  
  // Associations
  associations: Association[];
  
  // UI state
  isPanelCollapsed: boolean;
  zoomLevel: number;
  
  // Actions
  setSlides: (slides: SlideData[]) => void;
  setCurrentSlideIndex: (index: number) => void;
  setSelectedShapeId: (id: string | null) => void;
  addShape: (slideIndex: number, shape: ShapeElement) => void;
  
  addImage: (file: File) => void;
  setCurrentImageIndex: (index: number) => void;
  setSelectedImageElementId: (id: string | null) => void;
  addImageElement: (imageIndex: number, element: ImageElement) => void;
  
  addAssociation: (association: Association) => void;
  removeAssociation: (shapeId: string, imageId: string) => void;
  updateAssociationStatus: (shapeId: string, imageId: string, status: Association['status']) => void;
  
  togglePanel: () => void;
  setZoomLevel: (level: number) => void;
  
  // Persistence
  exportData: () => string;
  importData: (data: string) => void;
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => void;
}

export const useSlideMatcherStore = create<SlideMatcherState>((set, get) => ({
  // Initial state
  slides: [],
  currentSlideIndex: 0,
  selectedShapeId: null,
  
  images: [],
  currentImageIndex: 0,
  selectedImageElementId: null,
  
  associations: [],
  
  isPanelCollapsed: false,
  zoomLevel: 1,
  
  // Actions
  setSlides: (slides) => set({ slides }),
  setCurrentSlideIndex: (index) => set({ currentSlideIndex: index }),
  setSelectedShapeId: (id) => set({ selectedShapeId: id }),
  addShape: (slideIndex, shape) => set((state) => ({
    slides: state.slides.map(slide => 
      slide.index === slideIndex 
        ? { ...slide, shapes: [...slide.shapes, shape] }
        : slide
    )
  })),
  
  addImage: (file) => {
    const url = URL.createObjectURL(file);
    const newImage: ImageData = {
      index: get().images.length,
      file,
      url,
      elements: []
    };
    set((state) => ({
      images: [...state.images, newImage],
      currentImageIndex: state.images.length
    }));
  },
  
  setCurrentImageIndex: (index) => set({ currentImageIndex: index }),
  setSelectedImageElementId: (id) => set({ selectedImageElementId: id }),
  addImageElement: (imageIndex, element) => set((state) => ({
    images: state.images.map(img => 
      img.index === imageIndex 
        ? { ...img, elements: [...img.elements, element] }
        : img
    )
  })),
  
  addAssociation: (association) => set((state) => ({
    associations: [...state.associations, association]
  })),
  
  removeAssociation: (shapeId, imageId) => set((state) => ({
    associations: state.associations.filter(a => 
      !(a.shapeId === shapeId && a.imageId === imageId)
    )
  })),
  
  updateAssociationStatus: (shapeId, imageId, status) => set((state) => ({
    associations: state.associations.map(a => 
      a.shapeId === shapeId && a.imageId === imageId 
        ? { ...a, status }
        : a
    )
  })),
  
  togglePanel: () => set((state) => ({ isPanelCollapsed: !state.isPanelCollapsed })),
  setZoomLevel: (level) => set({ zoomLevel: Math.max(0.5, Math.min(3, level)) }),
  
  exportData: () => {
    const state = get();
    return JSON.stringify({
      associations: state.associations,
      slides: state.slides.map(s => ({ ...s, shapes: s.shapes })),
      images: state.images.map(i => ({ ...i, elements: i.elements }))
    });
  },
  
  importData: (data) => {
    try {
      const parsed = JSON.parse(data);
      set({
        associations: parsed.associations || [],
        slides: parsed.slides || [],
        images: parsed.images || []
      });
    } catch (error) {
      console.error('Failed to import data:', error);
    }
  },
  
  saveToLocalStorage: () => {
    const data = get().exportData();
    localStorage.setItem('slide-matcher-data', data);
  },
  
  loadFromLocalStorage: () => {
    const data = localStorage.getItem('slide-matcher-data');
    if (data) {
      get().importData(data);
    }
  }
}));
