import create from 'zustand';
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
