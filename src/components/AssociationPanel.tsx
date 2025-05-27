
import React from 'react';
import { useSlideMatcherStore } from '@/stores/slideMatcherStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Download, Upload, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AssociationPanel = () => {
  const {
    associations,
    slides,
    images,
    selectedShapeId,
    selectedImageElementId,
    isPanelCollapsed,
    addAssociation,
    removeAssociation,
    updateAssociationStatus,
    togglePanel,
    exportData,
    importData,
    saveToLocalStorage
  } = useSlideMatcherStore();
  
  const { toast } = useToast();

  const handleCreateAssociation = () => {
    if (selectedShapeId && selectedImageElementId) {
      const newAssociation = {
        shapeId: selectedShapeId,
        imageId: selectedImageElementId,
        status: 'active' as const
      };
      
      addAssociation(newAssociation);
      saveToLocalStorage();
      
      toast({
        title: "Associação Criada",
        description: `${selectedShapeId} ↔ ${selectedImageElementId}`,
      });
    } else {
      toast({
        title: "Seleção Incompleta",
        description: "Selecione uma forma e um elemento de imagem primeiro",
        variant: "destructive",
      });
    }
  };

  const handleRemoveAssociation = (shapeId: string, imageId: string) => {
    removeAssociation(shapeId, imageId);
    saveToLocalStorage();
    
    toast({
      title: "Associação Removida",
      description: `${shapeId} ↔ ${imageId}`,
    });
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'slide-matcher-data.json';
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Dados Exportados",
      description: "Arquivo JSON baixado com sucesso",
    });
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result as string;
          importData(data);
          toast({
            title: "Dados Importados",
            description: "Configurações carregadas com sucesso",
          });
        } catch (error) {
          toast({
            title: "Erro na Importação",
            description: "Arquivo JSON inválido",
            variant: "destructive",
          });
        }
      };
      reader.readAsText(file);
    }
  };

  const getShapeName = (shapeId: string) => {
    for (const slide of slides) {
      const shape = slide.shapes.find(s => s.id === shapeId);
      if (shape) return shape.metadata || shape.id;
    }
    return shapeId;
  };

  const getImageElementText = (imageId: string) => {
    for (const image of images) {
      const element = image.elements.find(e => e.id === imageId);
      if (element) return element.text || element.id;
    }
    return imageId;
  };

  return (
    <div className={`bg-white border-l border-gray-200 transition-all duration-300 ${
      isPanelCollapsed ? 'w-12' : 'w-80'
    }`}>
      {/* Toggle Button */}
      <div className="p-2 border-b border-gray-200">
        <Button
          variant="ghost"
          size="sm"
          onClick={togglePanel}
          className="w-full"
        >
          {isPanelCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </Button>
      </div>

      {!isPanelCollapsed && (
        <div className="h-full flex flex-col">
          {/* Header */}
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Painel de Associações</CardTitle>
          </CardHeader>

          <CardContent className="flex-1 space-y-4">
            {/* Current Selection */}
            <div className="space-y-2">
              <h3 className="font-medium text-sm text-gray-700">Seleção Atual:</h3>
              <div className="text-xs space-y-1">
                <div className="p-2 bg-blue-50 rounded">
                  <span className="font-medium">Forma:</span> {selectedShapeId || 'Nenhuma'}
                </div>
                <div className="p-2 bg-orange-50 rounded">
                  <span className="font-medium">Elemento:</span> {selectedImageElementId || 'Nenhum'}
                </div>
              </div>
              
              <Button
                onClick={handleCreateAssociation}
                disabled={!selectedShapeId || !selectedImageElementId}
                className="w-full"
                size="sm"
              >
                Criar Associação
              </Button>
            </div>

            {/* Associations List */}
            <div className="space-y-2">
              <h3 className="font-medium text-sm text-gray-700">
                Associações ({associations.length})
              </h3>
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {associations.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-4">
                    Nenhuma associação criada
                  </p>
                ) : (
                  associations.map((association, index) => (
                    <div
                      key={`${association.shapeId}-${association.imageId}`}
                      className="p-2 border border-gray-200 rounded text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-1 rounded text-xs ${
                          association.status === 'active' ? 'bg-green-100 text-green-800' :
                          association.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {association.status === 'active' ? 'Ativo' :
                           association.status === 'pending' ? 'Pendente' : 'Erro'}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAssociation(association.shapeId, association.imageId)}
                          className="h-6 w-6 p-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      
                      <div className="space-y-1">
                        <div>
                          <span className="font-medium">Forma:</span>
                          <div className="text-blue-600 truncate">{getShapeName(association.shapeId)}</div>
                        </div>
                        <div>
                          <span className="font-medium">Elemento:</span>
                          <div className="text-orange-600 truncate">{getImageElementText(association.imageId)}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Data Management */}
            <div className="space-y-2 pt-4 border-t border-gray-200">
              <h3 className="font-medium text-sm text-gray-700">Gerenciar Dados</h3>
              
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  className="w-full"
                >
                  <Download className="w-3 h-3 mr-2" />
                  Exportar JSON
                </Button>
                
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                  id="import-data"
                />
                <label htmlFor="import-data">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full cursor-pointer"
                    asChild
                  >
                    <span>
                      <Upload className="w-3 h-3 mr-2" />
                      Importar JSON
                    </span>
                  </Button>
                </label>
              </div>
            </div>

            {/* Statistics */}
            <div className="space-y-2 pt-4 border-t border-gray-200">
              <h3 className="font-medium text-sm text-gray-700">Estatísticas</h3>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-gray-50 rounded text-center">
                  <div className="font-medium">{slides.length}</div>
                  <div className="text-gray-600">Slides</div>
                </div>
                <div className="p-2 bg-gray-50 rounded text-center">
                  <div className="font-medium">{images.length}</div>
                  <div className="text-gray-600">Imagens</div>
                </div>
                <div className="p-2 bg-gray-50 rounded text-center">
                  <div className="font-medium">
                    {slides.reduce((acc, slide) => acc + slide.shapes.length, 0)}
                  </div>
                  <div className="text-gray-600">Formas</div>
                </div>
                <div className="p-2 bg-gray-50 rounded text-center">
                  <div className="font-medium">
                    {images.reduce((acc, image) => acc + image.elements.length, 0)}
                  </div>
                  <div className="text-gray-600">Elementos</div>
                </div>
              </div>
            </div>
          </CardContent>
        </div>
      )}
    </div>
  );
};

export default AssociationPanel;
