import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, FileText, X, Loader2, Sparkles, Pencil, Check, GripVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export interface DocumentoPdf {
  url: string;
  nome: string;
}

interface PdfUploaderProps {
  documenti: DocumentoPdf[];
  onDocumentiChange: (docs: DocumentoPdf[]) => void;
  onDataExtracted?: (data: any) => void;
  parseFunction: "parse-bando-pdf" | "parse-avviso-pdf";
  disabled?: boolean;
  label?: string;
}

interface SortableItemProps {
  doc: DocumentoPdf;
  index: number;
  disabled: boolean;
  editingIndex: number | null;
  editingName: string;
  onStartEdit: (index: number) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onEditingNameChange: (name: string) => void;
  onRemove: (index: number) => void;
}

const SortableItem = ({
  doc,
  index,
  disabled,
  editingIndex,
  editingName,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onEditingNameChange,
  onRemove,
}: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: doc.url });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 bg-muted rounded-md"
    >
      {!disabled && (
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
      )}
      
      <FileText className="h-4 w-4 text-red-500 flex-shrink-0" />
      
      {editingIndex === index ? (
        // Edit mode
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Input
            value={editingName}
            onChange={(e) => onEditingNameChange(e.target.value)}
            className="h-7 text-sm"
            placeholder="Nome documento"
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSaveEdit();
              if (e.key === 'Escape') onCancelEdit();
            }}
            autoFocus
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onSaveEdit}
            className="h-7 w-7 p-0"
          >
            <Check className="h-4 w-4 text-green-600" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancelEdit}
            className="h-7 w-7 p-0"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      ) : (
        // View mode
        <>
          <a 
            href={doc.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline truncate flex-1 min-w-0"
          >
            {doc.nome}
          </a>
          {!disabled && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onStartEdit(index)}
                className="h-7 w-7 p-0"
                title="Modifica nome"
              >
                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemove(index)}
                className="h-7 w-7 p-0"
                title="Rimuovi"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export const PdfUploader = ({
  documenti,
  onDocumentiChange,
  onDataExtracted,
  parseFunction,
  disabled = false,
  label = "Documenti PDF"
}: PdfUploaderProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadOnlyInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const validateFile = (file: File): boolean => {
    if (file.type !== 'application/pdf') {
      toast({ 
        title: "Errore", 
        description: "Seleziona un file PDF valido", 
        variant: "destructive" 
      });
      return false;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ 
        title: "Errore", 
        description: "Il file PDF è troppo grande (max 10MB)", 
        variant: "destructive" 
      });
      return false;
    }

    return true;
  };

  const getDefaultName = (fileName: string): string => {
    // Remove extension and timestamp prefix
    let name = fileName.replace(/\.pdf$/i, '');
    const match = name.match(/^\d+_(.+)$/);
    if (match) {
      name = match[1];
    }
    // Replace underscores with spaces and capitalize
    return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const uploadPdfToStorage = async (file: File): Promise<string | null> => {
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);
      const base64 = await base64Promise;

      // Upload to storage
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storagePath = `${parseFunction === 'parse-avviso-pdf' ? 'avvisi/' : ''}${timestamp}_${safeName}`;

      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const { error: uploadError } = await supabase.storage
        .from('bandi-documenti')
        .upload(storagePath, bytes, {
          contentType: 'application/pdf',
          upsert: false
        });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from('bandi-documenti')
        .getPublicUrl(storagePath);

      return urlData?.publicUrl || null;
    } catch (err) {
      console.error("Error uploading PDF:", err);
      return null;
    }
  };

  const handlePdfUploadWithAI = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !validateFile(file)) return;

    setIsLoading(true);
    
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);
      const base64 = await base64Promise;

      const { data, error } = await supabase.functions.invoke(parseFunction, {
        body: { pdfBase64: base64, fileName: file.name }
      });

      if (error) throw error;

      if (data?.error) {
        toast({ 
          title: "Errore AI", 
          description: data.error, 
          variant: "destructive" 
        });
        return;
      }

      // Add PDF document to list with default name
      if (data?.pdfUrl) {
        const defaultName = getDefaultName(file.name);
        onDocumentiChange([...documenti, { url: data.pdfUrl, nome: defaultName }]);
      }

      // Call callback with extracted data
      if (data?.data && onDataExtracted) {
        onDataExtracted(data.data);
        toast({ 
          title: "Dati estratti con successo", 
          description: "I campi sono stati popolati automaticamente dal PDF" 
        });
      }

    } catch (err: any) {
      console.error("PDF processing error:", err);
      toast({ 
        title: "Errore", 
        description: err.message || "Errore nell'elaborazione del PDF", 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handlePdfUploadOnly = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newDocs: DocumentoPdf[] = [];

    try {
      for (const file of Array.from(files)) {
        if (!validateFile(file)) continue;

        const url = await uploadPdfToStorage(file);
        if (url) {
          const defaultName = getDefaultName(file.name);
          newDocs.push({ url, nome: defaultName });
        }
      }

      if (newDocs.length > 0) {
        onDocumentiChange([...documenti, ...newDocs]);
        toast({ 
          title: "Upload completato", 
          description: `${newDocs.length} PDF caricati con successo` 
        });
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      toast({ 
        title: "Errore", 
        description: err.message || "Errore nel caricamento", 
        variant: "destructive" 
      });
    } finally {
      setIsUploading(false);
      if (uploadOnlyInputRef.current) {
        uploadOnlyInputRef.current.value = '';
      }
    }
  };

  const handleRemoveDoc = (index: number) => {
    onDocumentiChange(documenti.filter((_, i) => i !== index));
  };

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditingName(documenti[index].nome);
  };

  const handleSaveEdit = () => {
    if (editingIndex === null) return;
    
    const updatedDocs = [...documenti];
    updatedDocs[editingIndex] = {
      ...updatedDocs[editingIndex],
      nome: editingName.trim() || getDefaultName(updatedDocs[editingIndex].url)
    };
    onDocumentiChange(updatedDocs);
    setEditingIndex(null);
    setEditingName("");
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingName("");
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = documenti.findIndex((doc) => doc.url === active.id);
      const newIndex = documenti.findIndex((doc) => doc.url === over.id);
      onDocumentiChange(arrayMove(documenti, oldIndex, newIndex));
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">{label}</label>
      
      {/* PDF List with Drag and Drop */}
      {documenti.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={documenti.map(doc => doc.url)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {documenti.map((doc, index) => (
                <SortableItem
                  key={doc.url}
                  doc={doc}
                  index={index}
                  disabled={disabled}
                  editingIndex={editingIndex}
                  editingName={editingName}
                  onStartEdit={handleStartEdit}
                  onSaveEdit={handleSaveEdit}
                  onCancelEdit={handleCancelEdit}
                  onEditingNameChange={setEditingName}
                  onRemove={handleRemoveDoc}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Upload Buttons */}
      {!disabled && (
        <div className="flex flex-wrap gap-2">
          {/* AI Parse Button */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handlePdfUploadWithAI}
              className="hidden"
              id={`pdf-ai-${parseFunction}`}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isLoading || isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analisi AI...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Carica con AI
                </>
              )}
            </Button>
          </div>

          {/* Simple Upload Button */}
          <div>
            <input
              ref={uploadOnlyInputRef}
              type="file"
              accept="application/pdf"
              onChange={handlePdfUploadOnly}
              className="hidden"
              id={`pdf-upload-${parseFunction}`}
              multiple
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isLoading || isUploading}
              onClick={() => uploadOnlyInputRef.current?.click()}
              className="gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Caricamento...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Carica PDF
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {disabled ? "Documenti allegati all'avviso." : "Trascina per riordinare. Clicca sulla matita per rinominare."}
      </p>
    </div>
  );
};
