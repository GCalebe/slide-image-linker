import React, { useEffect } from 'react';
import PowerPointViewer from './PowerPointViewer';
import ImageViewer from './ImageViewer';
import AssociationPanel from './AssociationPanel';
import { useSlideMatcherStore } from '@/stores/slideMatcherStore';

const SlideMatcherApp: React.FC = () => {
  const { currentPptxId, loadSlidesFromBackend } = useSlideMatcherStore();

  useEffect(() => {
    if (currentPptxId) {
      loadSlidesFromBackend(currentPptxId);
    }
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
