// src/components/AssociationPanel.tsx
import React from 'react';
import { useSlideMatcherStore } from '@/stores/slideMatcherStore';
import { Button } from '@/components/ui/button';
import { Download, Upload, Link, Trash2, FileDown } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const AssociationPanel: React.FC = () => {
  const {
    associations,
    isPanelOpen,
    togglePanel,
    createAssociation,
    removeAssociation,
    importMappings,
    exportMappings,
    generatePowerPoint,
  } = useSlideMatcherStore();

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        importMappings(data);
        toast({ title: 'Importação concluída', description: file.name });
      } catch {
        toast({ title: 'Erro na importação', description: 'JSON inválido', variant: 'destructive' });
      }
    };
    reader.readAsText(file);
  };

  const handleExport = () => {
    exportMappings();
    toast({ title: 'Exportação', description: 'Arquivo JSON gerado' });
  };

  const handleGenerate = () => {
    if (associations.length === 0) {
      toast({ title: 'Nenhuma associação', description: 'Associe ao menos 1 elemento', variant: 'warning' });
      return;
    }
    generatePowerPoint();
    toast({ title: 'Processando', description: 'Gerando novo PPTX...' });
  };

  return (
    <div
      className={`fixed top-0 right-0 h-full w-80 bg-white shadow-xl transform transition-transform ${
        isPanelOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {/* Cabeçalho */}
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="text-lg font-semibold">Associações</h3>
        <Button variant="ghost" size="icon" onClick={togglePanel}>
          {isPanelOpen ? '✕' : '→'}
        </Button>
      </div>

      <div className="p-4 flex flex-col space-y-4 overflow-y-auto h-[calc(100%-4rem)]">
        {/* Criar nova associação */}
        <Button onClick={createAssociation} variant="outline">
          <Link className="w-4 h-4 mr-2" />
          Criar Associação
        </Button>

        {/* Import / Export JSON */}
        <div className="flex space-x-2">
          <Button onClick={() => fileInputRef.current?.click()} variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Importar JSON
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />

          <Button onClick={handleExport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar JSON
          </Button>
        </div>

        {/* Gerar novo PPTX */}
        <Button onClick={handleGenerate} variant="secondary">
          <FileDown className="w-4 h-4 mr-2" />
          Generate PPT
        </Button>

        {/* Lista de associações */}
        <div className="mt-4 flex-1 overflow-auto">
          {associations.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhuma associação criada.</p>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b">
                  <th className="py-2">Shape ID</th>
                  <th className="py-2">Image ID</th>
                  <th className="py-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {associations.map((assoc) => (
                  <tr key={`${assoc.shapeId}-${assoc.imageId}`} className="border-b last:border-none">
                    <td className="py-2">{assoc.shapeId}</td>
                    <td className="py-2">{assoc.imageId}</td>
                    <td className="py-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeAssociation(assoc.shapeId, assoc.imageId)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssociationPanel;
