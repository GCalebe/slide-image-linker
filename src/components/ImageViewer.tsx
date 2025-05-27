
import React, { useRef, useState } from 'react';
import { useSlideMatcherStore } from '@/stores/slideMatcherStore';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ImageViewer = () => {
  const {
    images,
    currentImageIndex,
    selectedImageElementId,
    associations,
    zoomLevel,
    addImage,
    setCurrentImageIndex,
    setSelectedImageElementId,
    addImageElement,
    setZoomLevel
  } = useSlideMatcherStore();
  
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const currentImage = images[currentImageIndex];

  const handleImageClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!currentImage) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / zoomLevel;
    const y = (event.clientY - rect.top) / zoomLevel;
    
    // Simulate OCR detection
    const newElementId = `Img${currentImageIndex + 1}-Box${currentImage.elements.length + 1}`;
    
    const newElement = {
      id: newElementId,
      imageIndex: currentImageIndex,
      coordinates: { x: x - 50, y: y - 25, width: 100, height: 50 },
      type: 'text' as const,
      text: `Texto detectado em (${Math.round(x)}, ${Math.round(y)})`,
      confidence: 0.95
    };
    
    addImageElement(currentImageIndex, newElement);
    setSelectedImageElementId(newElementId);
    
    toast({
      title: "Elemento Detectado",
      description: `Criado ${newElementId}`,
    });
  };

  const handleWheel = (event: React.WheelEvent) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.1 : 0.1;
    setZoomLevel(zoomLevel + delta);
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    } else if (direction === 'next' && currentImageIndex < images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const getElementBorderColor = (elementId: string) => {
    const isAssociated = associations.some(a => a.imageId === elementId);
    if (isAssociated) return 'border-green-400';
    if (selectedImageElementId === elementId) return 'border-orange-400';
    return 'border-orange-300';
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      addImage(file);
      toast({
        title: "Imagem Carregada",
        description: "Processando com OCR...",
      });
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(event.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      imageFiles.forEach(file => {
        addImage(file);
      });
      toast({
        title: "Imagens Carregadas",
        description: `${imageFiles.length} imagem(ns) processadas com OCR...`,
      });
    } else {
      toast({
        title: "Arquivo Inválido",
        description: "Por favor, selecione arquivos de imagem válidos",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="p-4 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Visualizador de Imagem</h2>
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              id="image-upload"
              multiple
            />
            <label htmlFor="image-upload">
              <Button variant="outline" size="sm" className="cursor-pointer">
                <Upload className="w-4 h-4 mr-2" />
                Carregar Imagem
              </Button>
            </label>
            <span className="text-sm text-gray-600">
              Zoom: {Math.round(zoomLevel * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Image Viewer */}
      <div 
        ref={containerRef}
        className={`flex-1 overflow-auto bg-gray-100 relative transition-colors ${
          isDragOver ? 'bg-orange-50 border-2 border-dashed border-orange-400' : ''
        }`}
        onWheel={handleWheel}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {currentImage ? (
          <div 
            className="relative inline-block cursor-crosshair"
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}
            onClick={handleImageClick}
          >
            <img
              src={currentImage.url}
              alt={`Imagem ${currentImageIndex + 1}`}
              className="block max-w-none max-h-none"
            />
            
            {/* Render detected elements */}
            {currentImage.elements.map((element) => (
              <div key={element.id} className="absolute group">
                <div
                  className={`absolute border-2 ${getElementBorderColor(element.id)} bg-transparent hover:bg-orange-50 hover:bg-opacity-20 transition-colors`}
                  style={{
                    left: element.coordinates.x,
                    top: element.coordinates.y,
                    width: element.coordinates.width,
                    height: element.coordinates.height,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImageElementId(element.id);
                  }}
                />
                
                {/* Element ID floating label */}
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
                
                {/* Tooltip */}
                <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-xs p-2 rounded shadow-lg z-20 pointer-events-none max-w-xs"
                     style={{
                       left: element.coordinates.x,
                       top: element.coordinates.y + element.coordinates.height + 5,
                     }}>
                  <p>{element.text}</p>
                  {element.confidence && (
                    <p className="text-gray-300">Confiança: {Math.round(element.confidence * 100)}%</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <Upload className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Arraste imagens aqui ou clique no botão para carregar</p>
              <p className="text-sm mt-2">Formatos suportados: JPG, PNG, GIF, WebP</p>
            </div>
          </div>
        )}
        
        {/* Drag overlay */}
        {isDragOver && (
          <div className="absolute inset-0 bg-orange-100 bg-opacity-50 flex items-center justify-center pointer-events-none">
            <div className="text-center text-orange-600">
              <Upload className="w-16 h-16 mx-auto mb-4" />
              <p className="text-xl font-semibold">Solte as imagens aqui</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateImage('prev')}
              disabled={currentImageIndex === 0}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-gray-600 min-w-0">
              Imagem {currentImageIndex + 1} de {images.length || 1}
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
    </div>
  );
};

export default ImageViewer;
