import React from 'react';
import { toast } from '@/components/ui/use-toast';

const PowerPointViewer: React.FC = () => {
  const {
    slides,
    currentSlideIndex,
    uploadPptx,
    setCurrentSlideIndex,
  } = useSlideMatcherStore();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        await uploadPptx(file);
      } catch {
        // Error handled in store
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="p-4 border-b bg-white flex items-center justify-between">
        <label htmlFor="ppt-upload">
          <Button variant="outline">Upload PPT</Button>
        </label>
        <input
          id="ppt-upload"
          type="file"
          accept=".pptx"
          className="hidden"
          onChange={handleFileChange}
        />
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setCurrentSlideIndex(currentSlideIndex - 1)}
            disabled={currentSlideIndex === 0}
            size="sm"
            variant="outline"
          >
            <ChevronLeft />
          </Button>
          <span>{currentSlideIndex + 1} / {slides.length}</span>
          <Button
            onClick={() => setCurrentSlideIndex(currentSlideIndex + 1)}
            disabled={currentSlideIndex >= slides.length - 1}
            size="sm"
            variant="outline"
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-auto flex items-center justify-center bg-gray-100">
        {slides[currentSlideIndex] ? (
          <img src={slides[currentSlideIndex].url} alt={`Slide ${currentSlideIndex+1}`} />
        ) : (
          <p className="text-gray-500">Nenhum slide disponível.</p>
        )}
      </div>
    </div>
  );
};

export default PowerPointViewer;
