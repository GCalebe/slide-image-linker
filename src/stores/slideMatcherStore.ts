import create from 'zustand';
  loadSlidesFromBackend: async (pptxId) => {
    // Optional: fetch slide count from backend, here assume 10
    const count = 10;
    const slides: Slide[] = [];
    for (let i = 1; i <= count; i++) {
      const res = await fetch(`${API_BASE}/api/slide/${pptxId}/${i}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const meta = JSON.parse(res.headers.get('X-Shape-Meta') || '[]');
      slides.push({ url, meta });
    }
    set({ slides, currentSlideIndex: 0 });
  },

  uploadImage: async (file) => {
    const form = new FormData(); form.append('file', file);
    const res1 = await fetch(`${API_BASE}/api/upload-image`, { method: 'POST', body: form });
    const { img_id } = await res1.json();
    const res2 = await fetch(`${API_BASE}/api/image/${img_id}`);
    const blob = await res2.blob();
    const url = URL.createObjectURL(blob);
    const boxes = JSON.parse(res2.headers.get('X-Box-Meta') || '[]');
    set(state => ({
      images: [...state.images, { id: img_id, url, elements: boxes }],
    }));
  },

  addAssociation: (shapeId, imageId) => {
    set(state => ({ associations: [...state.associations, { shapeId, imageId }] }));
  },
  removeAssociation: (shapeId, imageId) => {
    set(state => ({ associations: state.associations.filter(a => !(a.shapeId === shapeId && a.imageId === imageId)) }));
  },

  importMappings: (data) => set({ associations: data }),
  exportMappings: () => {
    const data = JSON.stringify(get().associations, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'mappings.json'; a.click();
  },

  generatePowerPoint: async () => {
    const { currentPptxId, associations } = get();
    const res = await fetch(`${API_BASE}/api/apply-mappings/${currentPptxId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(associations),
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentPptxId}_updated.pptx`;
    a.click();
  },

  togglePanel: () => set(state => ({ isPanelOpen: !state.isPanelOpen })),
  setCurrentSlideIndex: (idx) => set({ currentSlideIndex: idx }),
  setCurrentImageIndex: (idx) => set({ currentImageIndex: idx }),
}));
