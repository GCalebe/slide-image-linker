
import React, { useEffect } from 'react';
import PowerPointViewer from './PowerPointViewer';
import ImageViewer from './ImageViewer';
import AssociationPanel from './AssociationPanel';
import { useSlideMatcherStore } from '@/stores/slideMatcherStore';
import { Card } from '@/components/ui/card';

const SlideMatcherApp = () => {
  const { loadFromLocalStorage } = useSlideMatcherStore();

  useEffect(() => {
    // Load saved data on app start
    loadFromLocalStorage();
  }, [loadFromLocalStorage]);

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Left Column - PowerPoint Viewer */}
      <div className="flex-1 min-w-0">
        <Card className="h-full rounded-none border-0 border-r border-gray-200">
          <PowerPointViewer />
        </Card>
      </div>

      {/* Right Column - Image Viewer */}
      <div className="flex-1 min-w-0">
        <Card className="h-full rounded-none border-0">
          <ImageViewer />
        </Card>
      </div>

      {/* Association Panel - Collapsible Right Dock */}
      <AssociationPanel />
    </div>
  );
};

export default SlideMatcherApp;
