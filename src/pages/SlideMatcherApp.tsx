import React, { useEffect } from 'react';
import PowerPointViewer from './PowerPointViewer';
import ImageViewer from './ImageViewer';
import AssociationPanel from './AssociationPanel';
import { useSlideMatcherStore } from '@/stores/slideMatcherStore';
import { toast } from '@/components/ui/use-toast';

const SlideMatcherApp: React.FC = () => {
  const { currentPptxId, loadSlidesFromBackend } = useSlideMatcherStore();

  useEffect(() => {
    const initLoad = async () => {
      if (currentPptxId) {
        try {
          await loadSlidesFromBackend(currentPptxId);
        } catch (error: any) {
          console.error("Erro ao carregar slides:", error);
          toast({ title: 'Erro', description: 'Falha ao carregar slides', variant: 'destructive' });
        }
      }
    };
    initLoad();
  }, [currentPptxId, loadSlidesFromBackend]);

  return (
    <div className="flex h-screen">
      <div className="w-1/2 border-r">
        <PowerPointViewer />
      </div>
      <div className="w-1/2 border-r">
        <ImageViewer />
      </div>
      <AssociationPanel />
    </div>
  );
};

export default SlideMatcherApp;
