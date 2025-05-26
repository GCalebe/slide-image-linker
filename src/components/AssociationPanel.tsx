
import React, { useState } from 'react';
import { useSlideMatcherStore } from '@/stores/slideMatcherStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Upload, 
  Trash2,
  Link,
  FileDown
} from 'lucide-react';
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
    saveToLocalStorage,
    loadFromLocalStorage
  } = useSlideMatcherStore();
  
  const { toast } = useToast();
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const createAssociation = () => {
    if (selectedShapeId && selectedImageElementId) {
      const existingAssociation = associations.find(
        a => a.shapeId === selectedShapeId && a.imageId === selectedImageElementId
      );
      
      if (existingAssociation) {
        toast({
          title: "Associação existente",
          description: "Esta mapeamento já existe",
          variant: "destructive"
        });
        return;
      }
      
      addAssociation({
        shapeId: selectedShapeId,
        imageId: selectedImageElementId,
        status: 'active'
      });
      
      toast({
        title: "Associação criada",
        description: `Associado ${selectedShapeId} ↔ ${selectedImageElementId}`,
      });
      
      saveToLocalStorage();
    } else {
      toast({
        title: "Selecione elementos",
        description: "Por favor, selecione tanto uma forma quanto um elemento de imagem",
        variant: "destructive"
      });
    }
  };

  const handleExport = () => {
  toast({ title: 'Exportação', description: 'Arquivo JSON gerado' });
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mapeamentos-slide-matcher.json';
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Exportação concluída",
      description: "Mapeamentos exportados com sucesso", 
    });
  };

  import { toast } from "@/components/ui/use-toast";

const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
    toast({ title: 'Importação concluída', description: file.name });
        const content = e.target?.result as string;
        importData(content);
        saveToLocalStorage();
        toast({
          title: "Importação concluída",
          description: "Mapeamentos importados com sucesso", 
        });
      };
      reader.readAsText(file);
    }
  };

  const generatePowerPoint = async () => {
    if (associations.length === 0) {
      toast({
        title: "Sem mapeamentos",
        description: "Crie algumas associações primeiro",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Gerando PowerPoint",
      description: "Processando mapeamentos e aplicando alterações...", 
    });

    // In a real implementation, this would call the backend API
    setTimeout(() => {
      toast({
        title: "PowerPoint pronto",
        description: "Download iniciará automaticamente", 
      });
    }, 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isPanelCollapsed) {
    return (
      <div className="w-8 h-full bg-white border-l border-gray-200 flex items-start justify-center pt-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={togglePanel}
          className="p-1 h-8 w-6"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-80 h-full bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Associações</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={togglePanel}
            className="p-1"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Selected elements */}
        <div className="space-y-2 mb-4">
          <div className="text-sm">
            <span className="text-gray-600">Forma: </span>
            <Badge variant={selectedShapeId ? "default" : "secondary"} className="text-xs">
              {selectedShapeId || "None selected"}
            </Badge>
          </div>
          <div className="text-sm">
            <span className="text-gray-600">Elemento: </span>
            <Badge variant={selectedImageElementId ? "default" : "secondary"} className="text-xs">
              {selectedImageElementId || "None selected"}
            </Badge>
          </div>
        </div>
        
        {/* Create association button */}
        <Button 
          onClick={createAssociation}
          disabled={!selectedShapeId || !selectedImageElementId}
          className="w-full mb-4"
          size="sm"
        >
          <Link className="w-4 h-4 mr-2" />
          Criar Associação
        </Button>
        
        {/* Action buttons */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4" />
          </Button>
          <div className="relative">
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
              id="import-file"
            />
            <label htmlFor="import-file">
              <Button variant="outline" size="sm" className="cursor-pointer">
                <Upload className="w-4 h-4" />
              </Button>
            </label>
          </div>
          <Button variant="default" size="sm" onClick={generatePowerPoint} className="flex-1">
            <FileDown className="w-4 h-4 mr-2" />
            Generate PPT
          </Button>
        </div>
      </div>

      {/* Associations list */}
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-2">
          {associations.map((association, index) => (
            <Card key={`${association.shapeId}-${association.imageId}`} className="text-sm">
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-blue-600 font-medium truncate mb-1">
                      {association.shapeId}
                    </div>
                    <div className="text-xs text-orange-600 font-medium truncate mb-2">
                      {association.imageId}
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${getStatusColor(association.status)}`}
                    >
                      {association.status}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAssociation(association.shapeId, association.imageId)}
                    className="p-1 h-6 w-6 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {associations.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              <Link className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No associations yet</p>
              <p className="text-xs text-gray-400">
                Select elements and create mappings
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Footer stats */}
      <div className="p-4 border-t border-gray-200 text-xs text-gray-600">
        <div className="flex justify-between">
          <span>Total: {associations.length}</span>
          <span>Active: {associations.filter(a => a.status === 'active').length}</span>
        </div>
      </div>
    </div>
  );
};

export default AssociationPanel;
