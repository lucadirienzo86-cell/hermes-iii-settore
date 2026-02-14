import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Award, Tag, Building2, GraduationCap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface BadgeCategoria {
  id: string;
  nome: string;
  icona: string | null;
  colore: string | null;
}

interface BadgeTipo {
  id: string;
  nome: string;
  categoria_id: string | null;
}

interface CategorySummary {
  categoria: BadgeCategoria;
  badgeCount: number;
  aziendeCount: number;
  docentiCount: number;
}

export const AdminBadgeSummary = () => {
  const [loading, setLoading] = useState(true);
  const [summaries, setSummaries] = useState<CategorySummary[]>([]);
  const [totals, setTotals] = useState({ badges: 0, aziende: 0, docenti: 0 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Carica categorie, badge, aziende e docenti in parallelo
      const [categorieRes, badgeRes, aziendeRes, docentiRes, assegnazioniRes] = await Promise.all([
        supabase.from('badge_categorie').select('id, nome, icona, colore').eq('attivo', true).order('ordine'),
        supabase.from('badge_tipi').select('id, nome, categoria_id').eq('attivo', true),
        supabase.from('aziende').select('id, badge_formativi'),
        supabase.from('docenti').select('id, badge_formativi'),
        supabase.from('badge_assegnazioni').select('id, badge_tipo_id, azienda_id, docente_id')
      ]);

      const categorie = categorieRes.data || [];
      const badges = badgeRes.data || [];
      const aziende = aziendeRes.data || [];
      const docenti = docentiRes.data || [];
      const assegnazioni = assegnazioniRes.data || [];

      // Crea mappa badge -> categoria
      const badgeToCategoriaMap = new Map<string, string>();
      badges.forEach(b => {
        if (b.categoria_id) {
          badgeToCategoriaMap.set(b.id, b.categoria_id);
        }
      });

      // Calcola riepilogo per categoria
      const summaryMap = new Map<string, CategorySummary>();
      
      categorie.forEach(cat => {
        summaryMap.set(cat.id, {
          categoria: cat,
          badgeCount: 0,
          aziendeCount: 0,
          docentiCount: 0
        });
      });

      // Conta badge per categoria
      badges.forEach(b => {
        if (b.categoria_id && summaryMap.has(b.categoria_id)) {
          summaryMap.get(b.categoria_id)!.badgeCount++;
        }
      });

      // Conta aziende uniche per categoria (basandosi sulle assegnazioni)
      const aziendePerCategoria = new Map<string, Set<string>>();
      const docentiPerCategoria = new Map<string, Set<string>>();

      assegnazioni.forEach(a => {
        const categoriaId = badgeToCategoriaMap.get(a.badge_tipo_id);
        if (categoriaId) {
          if (a.azienda_id) {
            if (!aziendePerCategoria.has(categoriaId)) {
              aziendePerCategoria.set(categoriaId, new Set());
            }
            aziendePerCategoria.get(categoriaId)!.add(a.azienda_id);
          }
          if (a.docente_id) {
            if (!docentiPerCategoria.has(categoriaId)) {
              docentiPerCategoria.set(categoriaId, new Set());
            }
            docentiPerCategoria.get(categoriaId)!.add(a.docente_id);
          }
        }
      });

      // Aggiorna conteggi
      aziendePerCategoria.forEach((set, catId) => {
        if (summaryMap.has(catId)) {
          summaryMap.get(catId)!.aziendeCount = set.size;
        }
      });

      docentiPerCategoria.forEach((set, catId) => {
        if (summaryMap.has(catId)) {
          summaryMap.get(catId)!.docentiCount = set.size;
        }
      });

      const summaryArray = Array.from(summaryMap.values()).sort((a, b) => 
        b.aziendeCount + b.docentiCount - (a.aziendeCount + a.docentiCount)
      );

      setSummaries(summaryArray);
      setTotals({
        badges: badges.length,
        aziende: new Set(assegnazioni.filter(a => a.azienda_id).map(a => a.azienda_id)).size,
        docenti: new Set(assegnazioni.filter(a => a.docente_id).map(a => a.docente_id)).size
      });
    } catch (error) {
      console.error('Errore caricamento riepilogo badge:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-card border border-border shadow-sm animate-fade-in">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Badge Formativi per Categoria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border border-border shadow-sm hover:shadow-md transition-all duration-300 animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          Badge Formativi per Categoria
        </CardTitle>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Tag className="h-4 w-4" />
            {totals.badges} badge
          </span>
          <span className="flex items-center gap-1">
            <Building2 className="h-4 w-4" />
            {totals.aziende} aziende
          </span>
          <span className="flex items-center gap-1">
            <GraduationCap className="h-4 w-4" />
            {totals.docenti} docenti
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {summaries.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">
            Nessuna categoria badge configurata
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {summaries.map((summary) => (
              <div
                key={summary.categoria.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0"
                  style={{ backgroundColor: `${summary.categoria.colore}20` }}
                >
                  {summary.categoria.icona || '🏷️'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{summary.categoria.nome}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {summary.badgeCount} badge
                    </Badge>
                    {summary.aziendeCount > 0 && (
                      <Badge variant="outline" className="text-xs">
                        <Building2 className="h-3 w-3 mr-1" />
                        {summary.aziendeCount}
                      </Badge>
                    )}
                    {summary.docentiCount > 0 && (
                      <Badge variant="outline" className="text-xs">
                        <GraduationCap className="h-3 w-3 mr-1" />
                        {summary.docentiCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
