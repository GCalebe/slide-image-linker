import React, { useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Upload, Image as ImageIcon } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useSlideMatcherStore } from '@/stores/slideMatcherStore';

const ImageViewer: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    images,
    currentImageIndex,
    uploadImage,
    setCurrentImageIndex,
  } = useSlideMatcherStore();

  const onDrop = async (files: File[]) => {
    for (const file of files) {
      try {
        await uploadImage(file);
      } catch {}
    }
  };

  const { getRootProps, getInputProps, open } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false,
    noClick: true,
  });

  const navigateImage = (dir: 'prev' | 'next') => {
    if (dir === 'prev' && currentImageIndex > 0)
      setCurrentImageIndex(currentImageIndex - 1);
    if (dir === 'next' && currentImageIndex < images.length - 1)
      setCurrentImageIndex(currentImageIndex + 1);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="p-4 bg-white border-b flex items-center justify-between">
        <h2 className="text-lg font-semibold">Visualizador de Imagem</h2>
        <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
          <Upload className="w-4 h-4 mr-1" />
          Upload Imagem
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => e.target.files && onDrop(Array.from(e.target.files))}
        />
      </div>
      <div {...getRootProps()} className="flex-1 bg-gray-100 relative" style={{ cursor: 'crosshair' }}>
        <input {...getInputProps()} />
        {images[currentImageIndex] ? (
          <img src={images[currentImageIndex].url} alt="Uploaded" className="max-w-full max-h-full m-auto block" />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            <ImageIcon className="w-12 h-12" />
            <span className="ml-2">Arraste ou faça upload de uma imagem</span>
          </div>
        )}
      </div>
      <div className="p-4 bg-white border-t flex items-center justify-between">
        <Button size="sm" onClick={() => navigateImage('prev')} disabled={currentImageIndex === 0}>
          <ChevronLeft />
        </Button>
        <span>{currentImageIndex + 1} / {images.length}</span>
        <Button size="sm" onClick={() => navigateImage('next')} disabled={currentImageIndex === images.length - 1}>
          <ChevronRight />
        </Button>
      </div>
  </div>
  );
};

export default ImageViewer;
