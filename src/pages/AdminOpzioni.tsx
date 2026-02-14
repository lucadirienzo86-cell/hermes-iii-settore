import { useState, useMemo } from "react";
import { Settings, Plus, Pencil, Check, X, Eye, EyeOff, GripVertical, ChevronDown, FolderOpen, Trash2, List, Layers, Search, Shield, Bell } from "lucide-react";
import AdminNotifichePush from "@/components/AdminNotifichePush";
import { arrayMove } from "@dnd-kit/sortable";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import Sidebar from "@/components/Sidebar";
import { useSpeseOptionsAdmin, SpeseOption } from "@/hooks/useSpeseOptionsAdmin";
import { useInvestimentiOptionsAdmin, InvestimentiOption } from "@/hooks/useInvestimentiOptionsAdmin";
import { useTipiAgevolazioneOptionsAdmin, TipiAgevolazioneOption } from "@/hooks/useTipiAgevolazioneOptionsAdmin";
import { useBadgeFormativiAdmin, BadgeTipoAdmin } from "@/hooks/useBadgeFormativiAdmin";
import { useBadgeCategorieAdmin, BadgeCategoria } from "@/hooks/useBadgeCategorieAdmin";
import { useRequisitiAdmin, RequisitoOption } from "@/hooks/useRequisitiAdmin";

type OptionItem = SpeseOption | InvestimentiOption | TipiAgevolazioneOption;

interface SortableItemProps<T extends OptionItem> {
  item: T;
  index: number;
  editingId: string | null;
  editValue: string;
  onEdit: (item: T) => void;
  onSave: (item: T) => void;
  onCancel: () => void;
  onEditChange: (value: string) => void;
  onToggleActive: (item: T) => void;
}

function SortableItem<T extends OptionItem>({
  item,
  index,
  editingId,
  editValue,
  onEdit,
  onSave,
  onCancel,
  onEditChange,
  onToggleActive,
}: SortableItemProps<T>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
    >
      <button
        className="cursor-grab active:cursor-grabbing touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>

      <span className="text-xs text-muted-foreground w-6 font-mono">
        {index + 1}
      </span>

      <div className="flex-1 min-w-0">
        {editingId === item.id ? (
          <Input
            value={editValue}
            onChange={(e) => onEditChange(e.target.value)}
            className="h-8"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") onSave(item);
              if (e.key === "Escape") onCancel();
            }}
          />
        ) : (
          <span className={`truncate ${!item.attivo ? 'text-muted-foreground line-through' : ''}`}>
            {item.nome}
          </span>
        )}
      </div>

      <Badge variant={item.attivo ? "default" : "secondary"} className="flex-shrink-0">
        {item.attivo ? "Attivo" : "Inattivo"}
      </Badge>

      <div className="flex items-center gap-1 flex-shrink-0">
        {editingId === item.id ? (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-green-600"
              onClick={() => onSave(item)}
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={onCancel}
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onEdit(item)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onToggleActive(item)}
            >
              {item.attivo ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

interface OptionsListProps<T extends OptionItem> {
  options: T[];
  isLoading: boolean;
  onReorder: (oldIndex: number, newIndex: number) => void;
  onToggleActive: (item: T) => void;
  onUpdate: (item: T, newName: string) => void;
}

function OptionsList<T extends OptionItem>({ 
  options, 
  isLoading, 
  onReorder,
  onToggleActive,
  onUpdate,
}: OptionsListProps<T>) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  const handleEdit = (item: T) => {
    setEditingId(item.id);
    setEditValue(item.nome);
  };

  const handleSave = (item: T) => {
    if (editValue.trim()) {
      onUpdate(item, editValue.trim());
    }
    setEditingId(null);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValue("");
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = options.findIndex((item) => item.id === active.id);
      const newIndex = options.findIndex((item) => item.id === over.id);
      onReorder(oldIndex, newIndex);
    }
  };

  if (options.length === 0) {
    return (
      <p className="text-muted-foreground text-sm text-center py-8">
        Nessuna opzione presente
      </p>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={options.map(o => o.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {options.map((item, index) => (
            <SortableItem
              key={item.id}
              item={item}
              index={index}
              editingId={editingId}
              editValue={editValue}
              onEdit={handleEdit}
              onSave={handleSave}
              onCancel={handleCancel}
              onEditChange={setEditValue}
              onToggleActive={onToggleActive}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

interface AddOptionFormProps {
  onAdd: (nome: string) => void;
  isAdding: boolean;
  placeholder?: string;
}

function AddOptionForm({ onAdd, isAdding, placeholder = "Nome nuova opzione" }: AddOptionFormProps) {
  const [newValue, setNewValue] = useState("");

  const handleAdd = () => {
    if (newValue.trim()) {
      onAdd(newValue.trim());
      setNewValue("");
    }
  };

  return (
    <div className="flex gap-2">
      <Input
        placeholder={placeholder}
        value={newValue}
        onChange={(e) => setNewValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleAdd();
        }}
      />
      <Button onClick={handleAdd} disabled={isAdding || !newValue.trim()}>
        <Plus className="h-4 w-4 mr-2" />
        Aggiungi
      </Button>
    </div>
  );
}

// Sortable Badge Item Component
interface SortableBadgeItemProps {
  badge: BadgeTipoAdmin;
  index: number;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}

function SortableBadgeItem({ badge, index, onEdit, onToggleActive, onDelete }: SortableBadgeItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: badge.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
    >
      <button
        className="cursor-grab active:cursor-grabbing touch-none pt-1"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <span className="text-xs text-muted-foreground w-5 font-mono pt-1">
        {index + 1}
      </span>
      <div 
        className="w-6 h-6 rounded-full flex-shrink-0 mt-0.5"
        style={{ backgroundColor: badge.colore || '#3B82F6' }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-medium ${!badge.attivo ? 'text-muted-foreground line-through' : ''}`}>
            {badge.nome}
          </span>
          <Badge variant={badge.attivo ? "default" : "secondary"} className="text-xs">
            {badge.attivo ? "Attivo" : "Inattivo"}
          </Badge>
        </div>
        {badge.descrizione && (
          <p className="text-xs text-muted-foreground mt-1">
            {badge.descrizione}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onEdit}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onToggleActive}
        >
          {badge.attivo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Badge Formativi Section with Categories
function BadgeFormativiSection() {
  const badgeAdmin = useBadgeFormativiAdmin();
  const categorieAdmin = useBadgeCategorieAdmin();
  
  const [categoriaDialogOpen, setCategoriaDialogOpen] = useState(false);
  const [badgeDialogOpen, setBadgeDialogOpen] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<BadgeCategoria | null>(null);
  const [editingBadge, setEditingBadge] = useState<BadgeTipoAdmin | null>(null);
  
  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'categoria' | 'badge'; id: string; nome: string } | null>(null);
  
  // View mode and filters for "All Badges" view
  const [viewMode, setViewMode] = useState<'categories' | 'all'>('categories');
  const [searchBadge, setSearchBadge] = useState('');
  const [filterCategoria, setFilterCategoria] = useState<string>('all');
  const [filterStato, setFilterStato] = useState<'all' | 'active' | 'inactive'>('all');
  
  // Form state
  const [formNome, setFormNome] = useState("");
  const [formDescrizione, setFormDescrizione] = useState("");
  const [formIcona, setFormIcona] = useState("");
  const [formColore, setFormColore] = useState("#3B82F6");
  const [formCategoriaId, setFormCategoriaId] = useState<string>("");
  
  // Filtered badges for "All Badges" view
  const filteredBadges = useMemo(() => {
    return badgeAdmin.options.filter(badge => {
      const matchSearch = badge.nome.toLowerCase().includes(searchBadge.toLowerCase()) ||
        (badge.descrizione?.toLowerCase().includes(searchBadge.toLowerCase()) ?? false);
      const matchCategoria = filterCategoria === 'all' || 
        (filterCategoria === 'none' ? badge.categoria_id === null : badge.categoria_id === filterCategoria);
      const matchStato = filterStato === 'all' || 
        (filterStato === 'active' && badge.attivo) || 
        (filterStato === 'inactive' && !badge.attivo);
      return matchSearch && matchCategoria && matchStato;
    }).sort((a, b) => (a.ordine || 0) - (b.ordine || 0));
  }, [badgeAdmin.options, searchBadge, filterCategoria, filterStato]);
  
  const getCategoriaName = (categoriaId: string | null) => {
    if (!categoriaId) return "Senza categoria";
    const cat = categorieAdmin.categorie.find(c => c.id === categoriaId);
    return cat?.nome || "Sconosciuta";
  };
  
  const badgeStats = useMemo(() => {
    const total = badgeAdmin.options.length;
    const active = badgeAdmin.options.filter(b => b.attivo).length;
    return { total, active, inactive: total - active };
  }, [badgeAdmin.options]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const resetForm = () => {
    setFormNome("");
    setFormDescrizione("");
    setFormIcona("");
    setFormColore("#3B82F6");
    setFormCategoriaId("");
    setEditingCategoria(null);
    setEditingBadge(null);
  };

  const openCategoriaDialog = (categoria?: BadgeCategoria) => {
    if (categoria) {
      setEditingCategoria(categoria);
      setFormNome(categoria.nome);
      setFormDescrizione(categoria.descrizione || "");
      setFormIcona(categoria.icona || "");
      setFormColore(categoria.colore || "#3B82F6");
    } else {
      resetForm();
    }
    setCategoriaDialogOpen(true);
  };

  const openBadgeDialog = (badge?: BadgeTipoAdmin, defaultCategoriaId?: string) => {
    if (badge) {
      setEditingBadge(badge);
      setFormNome(badge.nome);
      setFormDescrizione(badge.descrizione || "");
      setFormIcona(badge.icona || "");
      setFormColore(badge.colore || "#3B82F6");
      setFormCategoriaId(badge.categoria_id || "none");
    } else {
      resetForm();
      if (defaultCategoriaId) {
        setFormCategoriaId(defaultCategoriaId);
      } else {
        setFormCategoriaId("none");
      }
    }
    setBadgeDialogOpen(true);
  };

  const handleSaveCategoria = () => {
    if (!formNome.trim()) return;
    
    if (editingCategoria) {
      categorieAdmin.updateCategoria({
        id: editingCategoria.id,
        nome: formNome,
        descrizione: formDescrizione,
        icona: formIcona,
        colore: formColore,
      });
    } else {
      categorieAdmin.addCategoria({
        nome: formNome,
        descrizione: formDescrizione,
        icona: formIcona,
        colore: formColore,
      });
    }
    setCategoriaDialogOpen(false);
    resetForm();
  };

  const handleSaveBadge = () => {
    if (!formNome.trim()) return;
    
    const categoriaIdToSave = formCategoriaId === "none" || formCategoriaId === "" ? null : formCategoriaId;
    
    if (editingBadge) {
      badgeAdmin.updateOption({
        id: editingBadge.id,
        nome: formNome,
        descrizione: formDescrizione,
        icona: formIcona,
        colore: formColore,
        categoria_id: categoriaIdToSave,
      });
    } else {
      badgeAdmin.addOption({
        nome: formNome,
        descrizione: formDescrizione,
        icona: formIcona,
        colore: formColore,
        categoria_id: categoriaIdToSave || undefined,
      });
    }
    setBadgeDialogOpen(false);
    resetForm();
  };

  const confirmDelete = (type: 'categoria' | 'badge', id: string, nome: string) => {
    setDeleteTarget({ type, id, nome });
    setDeleteConfirmOpen(true);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    
    if (deleteTarget.type === 'categoria') {
      categorieAdmin.deleteCategoria(deleteTarget.id);
    } else {
      badgeAdmin.deleteBadge(deleteTarget.id);
    }
    setDeleteConfirmOpen(false);
    setDeleteTarget(null);
  };

  const getBadgesByCategoria = (categoriaId: string | null) => {
    return badgeAdmin.options
      .filter(b => b.categoria_id === categoriaId)
      .sort((a, b) => (a.ordine || 0) - (b.ordine || 0));
  };

  const handleBadgeDragEnd = (event: DragEndEvent, categoriaId: string | null) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const badges = getBadgesByCategoria(categoriaId);
      const oldIndex = badges.findIndex(b => b.id === active.id);
      const newIndex = badges.findIndex(b => b.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(badges, oldIndex, newIndex);
        badgeAdmin.reorderBadges(reordered.map(b => b.id));
      }
    }
  };

  const uncategorizedBadges = getBadgesByCategoria(null);

  if (categorieAdmin.isLoading || badgeAdmin.isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* View mode toggle and actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-2">
          <Button 
            variant={viewMode === 'categories' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setViewMode('categories')}
          >
            <Layers className="h-4 w-4 mr-2" />
            Per Categoria
          </Button>
          <Button 
            variant={viewMode === 'all' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setViewMode('all')}
          >
            <List className="h-4 w-4 mr-2" />
            Tutti i Badge
          </Button>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => openCategoriaDialog()} variant="outline" size="sm">
            <FolderOpen className="h-4 w-4 mr-2" />
            Nuova Categoria
          </Button>
          <Button onClick={() => openBadgeDialog()} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nuovo Badge
          </Button>
        </div>
      </div>
      
      {/* All Badges View */}
      {viewMode === 'all' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca per nome o descrizione..."
                value={searchBadge}
                onChange={(e) => setSearchBadge(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterCategoria} onValueChange={setFilterCategoria}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte le categorie</SelectItem>
                <SelectItem value="none">Senza categoria</SelectItem>
                {categorieAdmin.categorie.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStato} onValueChange={(v) => setFilterStato(v as typeof filterStato)}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Stato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti</SelectItem>
                <SelectItem value="active">Attivi</SelectItem>
                <SelectItem value="inactive">Inattivi</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Stats */}
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>Totale: <strong className="text-foreground">{badgeStats.total}</strong></span>
            <span>Attivi: <strong className="text-green-600">{badgeStats.active}</strong></span>
            <span>Inattivi: <strong className="text-muted-foreground">{badgeStats.inactive}</strong></span>
            {(searchBadge || filterCategoria !== 'all' || filterStato !== 'all') && (
              <span>Filtrati: <strong className="text-primary">{filteredBadges.length}</strong></span>
            )}
          </div>
          
          {/* Table */}
          {filteredBadges.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nessun badge trovato con i filtri selezionati
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Colore</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead className="hidden md:table-cell">Categoria</TableHead>
                    <TableHead className="hidden lg:table-cell">Descrizione</TableHead>
                    <TableHead className="w-[100px]">Stato</TableHead>
                    <TableHead className="w-[120px] text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBadges.map((badge) => (
                    <TableRow key={badge.id}>
                      <TableCell>
                        <div 
                          className="w-6 h-6 rounded-full"
                          style={{ backgroundColor: badge.colore || '#3B82F6' }}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <span className={!badge.attivo ? 'text-muted-foreground line-through' : ''}>
                          {badge.nome}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className="text-xs">
                          {getCategoriaName(badge.categoria_id)}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className="text-sm text-muted-foreground line-clamp-1">
                          {badge.descrizione || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={badge.attivo ? "default" : "secondary"}>
                          {badge.attivo ? "Attivo" : "Inattivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openBadgeDialog(badge)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => badgeAdmin.toggleActive({ id: badge.id, attivo: !badge.attivo })}
                          >
                            {badge.attivo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => confirmDelete('badge', badge.id, badge.nome)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}
      
      {/* Categories View */}
      {viewMode === 'categories' && (
        <>

      <Accordion type="multiple" className="space-y-2" defaultValue={categorieAdmin.categorie.map(c => c.id)}>
        {categorieAdmin.categorie.map((categoria) => {
          const badges = getBadgesByCategoria(categoria.id);
          return (
            <AccordionItem 
              key={categoria.id} 
              value={categoria.id}
              className="border rounded-lg overflow-hidden"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-accent/50">
                <div className="flex items-center gap-3 flex-1">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: categoria.colore || "#3B82F6" }}
                  >
                    {categoria.icona ? categoria.icona.charAt(0) : categoria.nome.charAt(0)}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium flex items-center gap-2">
                      {categoria.nome}
                      <Badge variant={categoria.attivo ? "default" : "secondary"} className="text-xs">
                        {categoria.attivo ? "Attiva" : "Inattiva"}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {badges.length} badge
                      </Badge>
                    </div>
                    {categoria.descrizione && (
                      <p className="text-xs text-muted-foreground mt-0.5">{categoria.descrizione}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openCategoriaDialog(categoria)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => categorieAdmin.toggleActive({ id: categoria.id, attivo: !categoria.attivo })}
                    >
                      {categoria.attivo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => confirmDelete('categoria', categoria.id, categoria.nome)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full border-dashed"
                    onClick={() => openBadgeDialog(undefined, categoria.id)}
                  >
                    <Plus className="h-3 w-3 mr-2" />
                    Aggiungi Badge a {categoria.nome}
                  </Button>
                  
                  {badges.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nessun badge in questa categoria
                    </p>
                  ) : (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={(e) => handleBadgeDragEnd(e, categoria.id)}
                    >
                      <SortableContext
                        items={badges.map(b => b.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {badges.map((badge, index) => (
                          <SortableBadgeItem
                            key={badge.id}
                            badge={badge}
                            index={index}
                            onEdit={() => openBadgeDialog(badge)}
                            onToggleActive={() => badgeAdmin.toggleActive({ id: badge.id, attivo: !badge.attivo })}
                            onDelete={() => confirmDelete('badge', badge.id, badge.nome)}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {/* Uncategorized badges */}
      {uncategorizedBadges.length > 0 && (
        <div className="border rounded-lg p-4 space-y-2 bg-muted/30">
          <h3 className="font-medium text-muted-foreground">Badge senza categoria</h3>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(e) => handleBadgeDragEnd(e, null)}
          >
            <SortableContext
              items={uncategorizedBadges.map(b => b.id)}
              strategy={verticalListSortingStrategy}
            >
              {uncategorizedBadges.map((badge, index) => (
                <SortableBadgeItem
                  key={badge.id}
                  badge={badge}
                  index={index}
                  onEdit={() => openBadgeDialog(badge)}
                  onToggleActive={() => badgeAdmin.toggleActive({ id: badge.id, attivo: !badge.attivo })}
                  onDelete={() => confirmDelete('badge', badge.id, badge.nome)}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}
      </>
      )}

      {/* Dialog Categoria */}
      <Dialog open={categoriaDialogOpen} onOpenChange={setCategoriaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategoria ? "Modifica Categoria" : "Nuova Categoria"}
            </DialogTitle>
            <DialogDescription>
              Le categorie organizzano i badge formativi per area tematica
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cat-nome">Nome *</Label>
              <Input
                id="cat-nome"
                value={formNome}
                onChange={(e) => setFormNome(e.target.value)}
                placeholder="Es. Informatica & Digitale"
              />
            </div>
            <div>
              <Label htmlFor="cat-desc">Descrizione</Label>
              <Textarea
                id="cat-desc"
                value={formDescrizione}
                onChange={(e) => setFormDescrizione(e.target.value)}
                placeholder="Breve descrizione della categoria..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cat-icona">Icona (nome lucide)</Label>
                <Input
                  id="cat-icona"
                  value={formIcona}
                  onChange={(e) => setFormIcona(e.target.value)}
                  placeholder="Es. Monitor"
                />
              </div>
              <div>
                <Label htmlFor="cat-colore">Colore</Label>
                <div className="flex gap-2">
                  <Input
                    id="cat-colore"
                    type="color"
                    value={formColore}
                    onChange={(e) => setFormColore(e.target.value)}
                    className="w-14 h-9 p-1"
                  />
                  <Input
                    value={formColore}
                    onChange={(e) => setFormColore(e.target.value)}
                    placeholder="#3B82F6"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoriaDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleSaveCategoria} disabled={!formNome.trim()}>
              {editingCategoria ? "Salva" : "Crea"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Badge */}
      <Dialog open={badgeDialogOpen} onOpenChange={setBadgeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingBadge ? "Modifica Badge" : "Nuovo Badge"}
            </DialogTitle>
            <DialogDescription>
              Ogni badge rappresenta un tipo di formazione specifica
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="badge-nome">Nome *</Label>
              <Input
                id="badge-nome"
                value={formNome}
                onChange={(e) => setFormNome(e.target.value)}
                placeholder="Es. Cybersecurity"
              />
            </div>
            <div>
              <Label htmlFor="badge-desc">Descrizione</Label>
              <Textarea
                id="badge-desc"
                value={formDescrizione}
                onChange={(e) => setFormDescrizione(e.target.value)}
                placeholder="Spiega brevemente a quale tipo di formazione si riferisce questo badge..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="badge-cat">Categoria</Label>
              <Select value={formCategoriaId} onValueChange={setFormCategoriaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nessuna categoria</SelectItem>
                  {categorieAdmin.categorie.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="badge-icona">Icona (emoji o nome)</Label>
                <Input
                  id="badge-icona"
                  value={formIcona}
                  onChange={(e) => setFormIcona(e.target.value)}
                  placeholder="Es. 🔐 o Shield"
                />
              </div>
              <div>
                <Label htmlFor="badge-colore">Colore</Label>
                <div className="flex gap-2">
                  <Input
                    id="badge-colore"
                    type="color"
                    value={formColore}
                    onChange={(e) => setFormColore(e.target.value)}
                    className="w-14 h-9 p-1"
                  />
                  <Input
                    value={formColore}
                    onChange={(e) => setFormColore(e.target.value)}
                    placeholder="#3B82F6"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBadgeDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleSaveBadge} disabled={!formNome.trim()}>
              {editingBadge ? "Salva" : "Crea"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === 'categoria' 
                ? `Sei sicuro di voler eliminare la categoria "${deleteTarget?.nome}"? I badge associati verranno spostati nella sezione "Senza categoria".`
                : `Sei sicuro di voler eliminare il badge "${deleteTarget?.nome}"? Questa azione rimuoverà anche tutte le assegnazioni esistenti.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Requisiti Section Component
function RequisitiSection() {
  const requisitiAdmin = useRequisitiAdmin();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRequisito, setEditingRequisito] = useState<RequisitoOption | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RequisitoOption | null>(null);
  
  // Form state
  const [formNome, setFormNome] = useState("");
  const [formDescrizione, setFormDescrizione] = useState("");
  const [formIcona, setFormIcona] = useState("");
  const [formObbligatorio, setFormObbligatorio] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const resetForm = () => {
    setFormNome("");
    setFormDescrizione("");
    setFormIcona("");
    setFormObbligatorio(false);
    setEditingRequisito(null);
  };

  const openDialog = (requisito?: RequisitoOption) => {
    if (requisito) {
      setEditingRequisito(requisito);
      setFormNome(requisito.nome);
      setFormDescrizione(requisito.descrizione || "");
      setFormIcona(requisito.icona || "");
      setFormObbligatorio(requisito.obbligatorio_default);
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formNome.trim()) return;
    
    if (editingRequisito) {
      requisitiAdmin.updateOption({
        id: editingRequisito.id,
        nome: formNome.trim(),
        descrizione: formDescrizione.trim() || null,
        icona: formIcona.trim() || null,
        obbligatorio_default: formObbligatorio
      });
    } else {
      requisitiAdmin.addOption({
        nome: formNome.trim(),
        descrizione: formDescrizione.trim() || undefined,
        icona: formIcona.trim() || undefined,
        obbligatorio_default: formObbligatorio
      });
    }
    setDialogOpen(false);
    resetForm();
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = requisitiAdmin.options.findIndex((item) => item.id === active.id);
      const newIndex = requisitiAdmin.options.findIndex((item) => item.id === over.id);
      requisitiAdmin.swapOrder(oldIndex, newIndex);
    }
  };

  const confirmDelete = (requisito: RequisitoOption) => {
    setDeleteTarget(requisito);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = () => {
    if (deleteTarget) {
      requisitiAdmin.deleteOption(deleteTarget.id);
      setDeleteConfirmOpen(false);
      setDeleteTarget(null);
    }
  };

  if (requisitiAdmin.isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button onClick={() => openDialog()}>
        <Plus className="h-4 w-4 mr-2" />
        Aggiungi Requisito
      </Button>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={requisitiAdmin.options.map(o => o.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {requisitiAdmin.options.map((requisito, index) => (
              <SortableRequisitoItem
                key={requisito.id}
                requisito={requisito}
                index={index}
                onEdit={() => openDialog(requisito)}
                onToggleActive={() => requisitiAdmin.toggleActive({ id: requisito.id, attivo: !requisito.attivo })}
                onDelete={() => confirmDelete(requisito)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {requisitiAdmin.options.length === 0 && (
        <p className="text-muted-foreground text-sm text-center py-8">
          Nessun requisito configurato
        </p>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingRequisito ? "Modifica Requisito" : "Nuovo Requisito"}
            </DialogTitle>
            <DialogDescription>
              Configura un requisito che potrà essere associato a bandi e avvisi
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formNome}
                onChange={(e) => setFormNome(e.target.value)}
                placeholder="Es: Obbligo assicurazione catastrofale"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descrizione">Descrizione</Label>
              <Textarea
                id="descrizione"
                value={formDescrizione}
                onChange={(e) => setFormDescrizione(e.target.value)}
                placeholder="Descrizione del requisito..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="icona">Icona (emoji)</Label>
              <Input
                id="icona"
                value={formIcona}
                onChange={(e) => setFormIcona(e.target.value)}
                placeholder="Es: 🛡️"
                className="w-24"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="obbligatorio"
                checked={formObbligatorio}
                onCheckedChange={setFormObbligatorio}
              />
              <Label htmlFor="obbligatorio">Obbligatorio per default</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleSave} disabled={!formNome.trim()}>
              {editingRequisito ? "Salva" : "Aggiungi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Elimina Requisito</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare "{deleteTarget?.nome}"? 
              Questa azione rimuoverà il requisito da tutti i bandi e avvisi associati.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Sortable Requisito Item
interface SortableRequisitoItemProps {
  requisito: RequisitoOption;
  index: number;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}

function SortableRequisitoItem({ requisito, index, onEdit, onToggleActive, onDelete }: SortableRequisitoItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: requisito.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
    >
      <button
        className="cursor-grab active:cursor-grabbing touch-none pt-1"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <span className="text-xs text-muted-foreground w-5 font-mono pt-1">
        {index + 1}
      </span>
      <div className="text-xl w-8 flex-shrink-0">
        {requisito.icona || "📋"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`font-medium ${!requisito.attivo ? 'text-muted-foreground line-through' : ''}`}>
            {requisito.nome}
          </span>
          <Badge variant={requisito.obbligatorio_default ? "destructive" : "secondary"} className="text-xs">
            {requisito.obbligatorio_default ? "Obbligatorio" : "Facoltativo"}
          </Badge>
          <Badge variant={requisito.attivo ? "default" : "secondary"} className="text-xs">
            {requisito.attivo ? "Attivo" : "Inattivo"}
          </Badge>
        </div>
        {requisito.descrizione && (
          <p className="text-xs text-muted-foreground mt-1">
            {requisito.descrizione}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onToggleActive}>
          {requisito.attivo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function AdminOpzioni() {
  const speseAdmin = useSpeseOptionsAdmin();
  const investimentiAdmin = useInvestimentiOptionsAdmin();
  const tipiAdmin = useTipiAgevolazioneOptionsAdmin();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 bg-background min-h-screen">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Gestione Opzioni Sistema</h1>
              <p className="text-muted-foreground">
                Gestisci le opzioni categorizzate per bandi e aziende. Trascina per riordinare.
              </p>
            </div>
          </div>

          <Tabs defaultValue="badge" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="badge">Badge Formativi</TabsTrigger>
              <TabsTrigger value="requisiti">Requisiti</TabsTrigger>
              <TabsTrigger value="investimenti">Investimenti</TabsTrigger>
              <TabsTrigger value="spese">Spese Ammissibili</TabsTrigger>
              <TabsTrigger value="tipi">Tipi Agevolazione</TabsTrigger>
              <TabsTrigger value="notifiche" className="flex items-center gap-1">
                <Bell className="h-4 w-4" />
                Notifiche
              </TabsTrigger>
            </TabsList>

            <TabsContent value="badge">
              <Card>
                <CardHeader>
                  <CardTitle>🎓 Badge Formativi</CardTitle>
                  <CardDescription>
                    Gestisci categorie e badge formativi per i fondi interprofessionali. 
                    Ogni badge include una descrizione che spiega il tipo di formazione a cui si riferisce.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <BadgeFormativiSection />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="requisiti">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Requisiti Bandi
                  </CardTitle>
                  <CardDescription>
                    Gestisci i requisiti obbligatori e facoltativi che possono essere associati a bandi e avvisi.
                    Ogni requisito può essere marcato come obbligatorio o facoltativo per default.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RequisitiSection />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="investimenti">
              <Card>
                <CardHeader>
                  <CardTitle>📊 Investimenti Finanziabili</CardTitle>
                  <CardDescription>
                    Gestisci le tipologie di investimenti finanziabili per i bandi
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <AddOptionForm
                    onAdd={investimentiAdmin.addOption}
                    isAdding={investimentiAdmin.isAdding}
                    placeholder="Nome nuovo investimento"
                  />
                  <OptionsList
                    options={investimentiAdmin.options}
                    isLoading={investimentiAdmin.isLoading}
                    onReorder={investimentiAdmin.swapOrder}
                    onToggleActive={(item) => investimentiAdmin.toggleActive({ 
                      id: item.id, 
                      attivo: !item.attivo 
                    })}
                    onUpdate={(item, newName) => investimentiAdmin.updateOption({ 
                      id: item.id, 
                      nome: newName 
                    })}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="spese">
              <Card>
                <CardHeader>
                  <CardTitle>💰 Spese Ammissibili</CardTitle>
                  <CardDescription>
                    Gestisci le tipologie di spese ammissibili per i bandi
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <AddOptionForm
                    onAdd={speseAdmin.addOption}
                    isAdding={speseAdmin.isAdding}
                    placeholder="Nome nuova spesa"
                  />
                  <OptionsList
                    options={speseAdmin.options}
                    isLoading={speseAdmin.isLoading}
                    onReorder={speseAdmin.swapOrder}
                    onToggleActive={(item) => speseAdmin.toggleActive({ 
                      id: item.id, 
                      attivo: !item.attivo 
                    })}
                    onUpdate={(item, newName) => speseAdmin.updateOption({ 
                      id: item.id, 
                      nome: newName 
                    })}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tipi">
              <Card>
                <CardHeader>
                  <CardTitle>🎁 Tipi Agevolazione</CardTitle>
                  <CardDescription>
                    Gestisci i tipi di agevolazione disponibili per i bandi
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <AddOptionForm
                    onAdd={tipiAdmin.addOption}
                    isAdding={tipiAdmin.isAdding}
                    placeholder="Nome nuovo tipo agevolazione"
                  />
                  <OptionsList
                    options={tipiAdmin.options}
                    isLoading={tipiAdmin.isLoading}
                    onReorder={tipiAdmin.swapOrder}
                    onToggleActive={(item) => tipiAdmin.toggleActive({ 
                      id: item.id, 
                      attivo: !item.attivo 
                    })}
                    onUpdate={(item, newName) => tipiAdmin.updateOption({ 
                      id: item.id, 
                      nome: newName 
                    })}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifiche">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notifiche Push Manuali
                  </CardTitle>
                  <CardDescription>
                    Invia notifiche push manuali agli utenti della piattaforma. 
                    Solo gli utenti che hanno attivato le notifiche riceveranno il messaggio.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AdminNotifichePush />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
