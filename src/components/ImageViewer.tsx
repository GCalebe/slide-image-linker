import React, { useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useSlideMatcherStore } from '@/stores/slideMatcherStore';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Upload, Image as ImageIcon } from 'lucide-react';
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
  const currentImage = images[currentImageIndex];

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      if (file.type.startsWith('image/')) {
        addImage(file);
        toast({
          title: "Imagem Carregada",
          description: `Adicionada ${file.name}`,
        });
      }
    });
  }, [addImage, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.webp']
    },
    multiple: true
  });

  const handleImageClick = async (event: React.MouseEvent<HTMLDivElement>) => {
    if (!currentImage) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / zoomLevel;
    const y = (event.clientY - rect.top) / zoomLevel;
    
    // Simulate OCR detection (in real app, this would call OpenRouter API)
    const newElementId = `Img${currentImageIndex + 1}-Box${currentImage.elements.length + 1}`;
    
    const newElement = {
      id: newElementId,
      imageIndex: currentImageIndex,
      coordinates: { x: x - 60, y: y - 20, width: 120, height: 40 },
      type: 'text' as const,
      text: `Detected text at (${Math.round(x)}, ${Math.round(y)})`,
      confidence: 0.85 + Math.random() * 0.1
    };
    
    addImageElement(currentImageIndex, newElement);
    setSelectedImageElementId(newElementId);
    
    toast({
      title: "Detecção de OCR",
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

  return (
<div className="mb-4">
  <label htmlFor="image-upload">
    <Button variant="outline" className="mb-2">
      <Upload className="w-4 h-4 mr-2" /> Upload Imagem
    </Button>
  </label>
  <input
    id="image-upload"
    type="file"
    accept="image/*"
    className="hidden"
    onChange={handleImageUpload}
  />
</div>

    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="p-4 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Visualizador de Imagens</h2>
          <span className="text-sm text-gray-600">
            Zoom: {Math.round(zoomLevel * 100)}%
          </span>
        </div>
      </div>

      {/* Image Viewer */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto bg-gray-100 relative"
        onWheel={handleWheel}
      >
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
                <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-xs p-2 rounded shadow-lg z-20 pointer-events-none"
                     style={{
                       left: element.coordinates.x,
                       top: element.coordinates.y + element.coordinates.height + 5,
                     }}>
                  {element.text} {element.confidence && `(${Math.round(element.confidence * 100)}%)`}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div 
            {...getRootProps()} 
            className={`flex items-center justify-center h-full border-2 border-dashed transition-colors ${
              isDragActive ? 'border-orange-400 bg-orange-50' : 'border-gray-300'
            }`}
          >
            <input {...getInputProps()} />
            <div className="text-center text-gray-500">
              <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              {isDragActive ? (
                <p>Solte as imagens aqui...</p>
              ) : (
                <div>
                          <p className="mb-2">Arraste e solte imagens aqui</p>
                  <Button variant="outline" size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Ou clique para selecionar
                  </Button>
                </div>
              )}
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
              Image {currentImageIndex + 1} of {images.length || 1}
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
            Elements detected: {currentImage?.elements.length || 0}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageViewer;
<label htmlFor="image-upload">
  <Button variant="outline" className="mb-2">
    <Upload className="w-4 h-4 mr-2" /> Upload Imagem
  </Button>
</label>
<input
  id="image-upload"
  type="file"
  accept="image/*"
  className="hidden"
  onChange={handleImageUpload}
/>


import React, { useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useSlideMatcherStore } from '@/stores/slideMatcherStore';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Upload, Image as ImageIcon } from 'lucide-react';
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
  const currentImage = images[currentImageIndex];

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erro",
        description: "Por favor, selecione uma imagem válida",
        variant: "destructive"
      });
      return;
    }

    try {
      addImage(file);
      toast({
        title: "Imagem Carregada",
        description: `Adicionada ${file.name}`,
      });
    } catch (error) {
      console.error('Erro ao carregar imagem:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar a imagem",
        variant: "destructive"
      });
    }
  }, [addImage, toast]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      if (file.type.startsWith('image/')) {
        try {
          addImage(file);
          toast({
            title: "Imagem Carregada",
            description: `Adicionada ${file.name}`,
          });
        } catch (error) {
          console.error('Erro ao carregar imagem:', error);
          toast({
            title: "Erro",
            description: "Falha ao carregar a imagem",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Erro",
          description: "Arquivo não é uma imagem válida",
          variant: "destructive"
        });
      }
    });
  }, [addImage, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.webp']
    },
    multiple: true
  });

  const handleImageClick = async (event: React.MouseEvent<HTMLDivElement>) => {
    if (!currentImage) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / zoomLevel;
    const y = (event.clientY - rect.top) / zoomLevel;
    
    // Simulate OCR detection (in real app, this would call OpenRouter API)
    const newElementId = `Img${currentImageIndex + 1}-Box${currentImage.elements.length + 1}`;
    
    const newElement = {
      id: newElementId,
      imageIndex: currentImageIndex,
      coordinates: { x: x - 60, y: y - 20, width: 120, height: 40 },
      type: 'text' as const,
      text: `Detected text at (${Math.round(x)}, ${Math.round(y)})`,
      confidence: 0.85 + Math.random() * 0.1
    };
    
    addImageElement(currentImageIndex, newElement);
    setSelectedImageElementId(newElementId);
    
    toast({
      title: "Detecção de OCR",
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

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="p-4 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Visualizador de Imagens</h2>
          <span className="text-sm text-gray-600">
            Zoom: {Math.round(zoomLevel * 100)}%
          </span>
        </div>
      </div>

      {/* Image Viewer */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto bg-gray-100 relative"
        onWheel={handleWheel}
      >
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
                <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-xs p-2 rounded shadow-lg z-20 pointer-events-none"
                     style={{
                       left: element.coordinates.x,
                       top: element.coordinates.y + element.coordinates.height + 5,
                     }}>
                  {element.text} {element.confidence && `(${Math.round(element.confidence * 100)}%)`}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div 
            {...getRootProps()} 
            className={`flex items-center justify-center h-full border-2 border-dashed transition-colors ${
              isDragActive ? 'border-orange-400 bg-orange-50' : 'border-gray-300'
            }`}
          >
            <input {...getInputProps()} />
            <div className="text-center text-gray-500">
              <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              {isDragActive ? (
                <p>Solte as imagens aqui...</p>
              ) : (
                <div>
                          <p className="mb-2">Arraste e solte imagens aqui</p>
                  <Button variant="outline" size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Ou clique para selecionar
                  </Button>
                </div>
              )}
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
              Image {currentImageIndex + 1} of {images.length || 1}
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
            Elements detected: {currentImage?.elements.length || 0}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageViewer;
