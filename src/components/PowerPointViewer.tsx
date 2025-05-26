
import React, { useRef, useEffect, useState } from 'react';
import { useSlideMatcherStore } from '@/stores/slideMatcherStore';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Upload, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import pptxParser from 'pptx-parser';
import { Progress } from '@/components/ui/progress';

const fetchSlide = async (pptxId: string, slideNum: number) => {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/slide/${pptxId}/${slideNum}`);
    if (!res.ok) {
      throw new Error(await res.text());
    }
    const blob = await res.blob();
    const meta = res.headers.get("X-Shape-Meta") || "[]";
    const url = URL.createObjectURL(blob);
    const slideData = { url, meta: JSON.parse(meta) };
    setSlides(slides.map((slide, index) => 
      index === slideNum - 1 ? slideData : slide
    ));
    setCurrentSlideIndex(slideNum - 1);
    
    toast({
      title: "Slide Carregado",
      description: `Slide ${slideNum} carregado com sucesso`
    });
  } catch (error) {
    console.error('Erro ao carregar slide:', error);
    toast({
      title: "Erro",
      description: "Falha ao carregar o slide",
      variant: "destructive"
    });
  }
};

const PowerPointViewer = () => {
  const {
    slides,
    currentSlideIndex,
    selectedShapeId,
    associations,
    zoomLevel,
    setCurrentSlideIndex,
    setSelectedShapeId,
    addShape,
    setZoomLevel,
    setSlides
  } = useSlideMatcherStore();
  
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const currentSlide = slides[currentSlideIndex];
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleShapeClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!currentSlide) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / zoomLevel;
    const y = (event.clientY - rect.top) / zoomLevel;
    
    // Simulate shape detection (in real app, this would call backend)
    const newShapeId = `Slide${currentSlideIndex + 1}-Shape${currentSlide.shapes.length + 1}`;
    
    const newShape = {
      id: newShapeId,
      slideIndex: currentSlideIndex,
      coordinates: { x: x - 50, y: y - 25, width: 100, height: 50 },
      type: 'shape' as const,
      metadata: `Detected shape at (${Math.round(x)}, ${Math.round(y)})`
    };
    
    addShape(currentSlideIndex, newShape);
    setSelectedShapeId(newShapeId);
    
    toast({
      title: "Shape Detected",
      description: `Created ${newShapeId}`,
    });
  };

  const handleWheel = (event: React.WheelEvent) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.1 : 0.1;
    setZoomLevel(zoomLevel + delta);
  };

  const navigateSlide = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    } else if (direction === 'next' && currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  };

  const getShapeBorderColor = (shapeId: string) => {
    const isAssociated = associations.some(a => a.shapeId === shapeId);
    if (isAssociated) return 'border-green-400';
    if (selectedShapeId === shapeId) return 'border-blue-400';
    return 'border-blue-300';
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;

  if (!file.name.toLowerCase().endsWith('.pptx')) {
    toast({
      title: "Erro",
      description: "Por favor, selecione um arquivo PPTX",
      variant: "destructive"
    });
    return;
  }

  setIsLoading(true);
  setUploadProgress(0);

  const form = new FormData();
  form.append("file", file);
  
  try {
    const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/upload-pptx`, {
      method: "POST",
      body: form,
    });

    if (!res.ok) {
      throw new Error(await res.text());
    }

    const data = await res.json();
    setSlides(data.slides || []);
    setCurrentSlideIndex(0);
    
    toast({
      title: "Upload Concluído",
      description: `Arquivo ${file.name} carregado com sucesso`
    });
  } catch (error) {
    console.error('Erro ao fazer upload:', error);
    toast({
      title: "Erro",
      description: "Falha ao fazer upload do arquivo",
      variant: "destructive"
    });
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="p-4 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Visualizador de PowerPoint</h2>
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept=".ppt,.pptx"
              onChange={handleFileUpload}
              className="hidden"
              id="ppt-upload"
            />
            <label htmlFor="ppt-upload">
              <Button 
                variant="outline" 
                size="sm" 
                className="cursor-pointer"
                disabled={isLoading}
              >
                <Upload className="w-4 h-4 mr-2" />
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  'Fazer upload de PPTX'
                )}
              </Button>
            </label>
            {isLoading && (
              <div className="mt-2">
                <Progress value={uploadProgress} />
              </div>
            )}
            <span className="text-sm text-gray-600">
              Zoom: {Math.round(zoomLevel * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Slide Viewer */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto bg-gray-100 relative"
        onWheel={handleWheel}
      >
        {currentSlide ? (
          <div 
            className="relative inline-block cursor-crosshair"
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}
            onClick={handleShapeClick}
          >
            <img
              src={currentSlide.imageUrl || "/placeholder.svg"}
              alt={`Slide ${currentSlideIndex + 1}`}
              className="block max-w-none"
              style={{ width: '800px', height: '600px' }}
            />
            
            {/* Render detected shapes */}
            {currentSlide.shapes.map((shape) => (
              <div key={shape.id} className="absolute group">
                <div
                  className={`absolute border-2 ${getShapeBorderColor(shape.id)} bg-transparent hover:bg-blue-50 hover:bg-opacity-20 transition-colors`}
                  style={{
                    left: shape.coordinates.x,
                    top: shape.coordinates.y,
                    width: shape.coordinates.width,
                    height: shape.coordinates.height,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedShapeId(shape.id);
                  }}
                />
                
                {/* Shape ID floating label */}
                {selectedShapeId === shape.id && (
                  <div
                    className="absolute bg-blue-600 text-white text-xs px-2 py-1 rounded shadow-lg z-10"
                    style={{
                      left: shape.coordinates.x + shape.coordinates.width + 5,
                      top: shape.coordinates.y - 5,
                    }}
                  >
                    {shape.id}
                  </div>
                )}
                
                {/* Tooltip */}
                <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-xs p-2 rounded shadow-lg z-20 pointer-events-none"
                     style={{
                       left: shape.coordinates.x,
                       top: shape.coordinates.y + shape.coordinates.height + 5,
                     }}>
                  {shape.metadata}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <Upload className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Upload a PowerPoint file to get started</p>
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
              onClick={() => navigateSlide('prev')}
              disabled={currentSlideIndex === 0}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-gray-600 min-w-0">
              Slide {currentSlideIndex + 1} of {slides.length || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateSlide('next')}
              disabled={currentSlideIndex >= slides.length - 1}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="text-xs text-gray-500">
            Shapes detected: {currentSlide?.shapes.length || 0}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PowerPointViewer;
