// src/components/ImageViewer.tsx
import React, { useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useSlideMatcherStore } from '@/stores/slideMatcherStore';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Upload, Image as ImageIcon } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const ImageViewer: React.FC = () => {
  const {
    images,
    currentImageIndex,
    selectedImageElementId,
    associations,
    addImage,
    addImageElement,
    setSelectedImageElementId,
    zoomLevel,
    setZoomLevel,
    setCurrentImageIndex,
  } = useSlideMatcherStore();

  const currentImage = images[currentImageIndex];

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      if (file.type.startsWith('image/')) {
        addImage(file);
        toast({
          title: 'Imagem Carregada',
          description: `Adicionada ${file.name}`,
        });
      }
    });
  }, [addImage]);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    open: openFileDialog,
  } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.webp'] },
    multiple: true,
    noClick: true,      // desabilita abrir diálogo ao clicar na área inteira
    noKeyboard: true,   // desabilita atalhos de teclado
  });

  const handleImageClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!currentImage) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / zoomLevel;
    const y = (event.clientY - rect.top) / zoomLevel;

    const newElementId = `Img${currentImageIndex + 1}-Box${currentImage.elements.length + 1}`;
    const newElement = {
      id: newElementId,
      imageIndex: currentImageIndex,
      coordinates: { x: x - 60, y: y - 20, width: 120, height: 40 },
      type: 'text' as const,
      text: `Detected text at (${Math.round(x)}, ${Math.round(y)})`,
      confidence: 0.85 + Math.random() * 0.1,
    };

    addImageElement(currentImageIndex, newElement);
    setSelectedImageElementId(newElementId);
    toast({
      title: 'Detecção de OCR',
      description: `Criado ${newElementId}`,
    });
  };

  const handleWheel = (event: React.WheelEvent) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.1 : 0.1;
    setZoomLevel(Math.max(0.1, zoomLevel + delta));
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    } else if (direction === 'next' && currentImageIndex < images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const getElementBorderColor = (elementId: string) => {
    if (associations.some(a => a.imageId === elementId)) return 'border-green-400';
    if (selectedImageElementId === elementId) return 'border-orange-400';
    return 'border-orange-300';
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="p-4 bg-white border-b border-gray-200 shadow-sm flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Visualizador de Imagens</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Zoom: {Math.round(zoomLevel * 100)}%</span>
          <Button variant="outline" size="sm" onClick={openFileDialog}>
            <Upload className="w-4 h-4 mr-2" />
            Upload Imagem
          </Button>
        </div>
      </div>

      {/* Dropzone + Image Viewer */}
      <div
        {...getRootProps()}
        ref={containerRef}
        className={`flex-1 overflow-auto bg-gray-100 relative ${isDragActive ? 'border-orange-400 bg-orange-50' : ''}`}
        onWheel={handleWheel}
      >
        <input {...getInputProps()} />

        {currentImage ? (
          <div
            className="relative inline-block cursor-crosshair"
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}
            onClick={handleImageClick}
          >
            <img
              src={currentImage.url}
              alt={`Image ${currentImageIndex + 1}`}
              className="block max-w-none"
              style={{ maxHeight: '600px', width: 'auto' }}
            />

            {currentImage.elements.map((element) => (
              <React.Fragment key={element.id}>
                <div
                  className={`absolute border-2 ${getElementBorderColor(element.id)} transition-colors`}
                  style={{
                    left: element.coordinates.x,
                    top: element.coordinates.y,
                    width: element.coordinates.width,
                    height: element.coordinates.height,
                  }}
                  onClick={e => {
                    e.stopPropagation();
                    setSelectedImageElementId(element.id);
                  }}
                />
                {selectedImageElementId === element.id && (
                  <div
                    className="absolute bg-orange-600 text-white text-xs px-2 py-1 rounded shadow-lg z-10"
                    style={{
                      left: element.coordinates.x + element.coordinates.width + 5,
                      top: element.coordinates.y - 5,
                    }}
                  >
                    {element.id}
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full border-2 border-dashed text-center p-8">
            <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            {isDragActive ? (
              <p>Solte as imagens aqui...</p>
            ) : (
              <p>Arraste e solte imagens aqui, ou clique em “Upload Imagem”.</p>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="p-4 bg-white border-t border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateImage('prev')}
            disabled={currentImageIndex === 0}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-gray-600">
            {currentImageIndex + 1} de {images.length || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateImage('next')}
            disabled={currentImageIndex >= images.length - 1}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <div className="text-xs text-gray-500">
          Elementos detectados: {currentImage?.elements.length || 0}
        </div>
      </div>
    </div>
  );
};

export default ImageViewer;
