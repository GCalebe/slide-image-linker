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
      } catch {
        // Error handled in store
      }
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
export default PowerPointViewer;
