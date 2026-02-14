import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCategorieAssociazioni } from '@/hooks/useCategorieAssociazioni';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Tag,
  Heart,
  Hotel,
  Calendar,
  Trophy,
  BookOpen,
  Leaf,
  Users,
  GraduationCap,
  Accessibility,
  Folder
} from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
  'heart-handshake': <Heart className="h-4 w-4" />,
  'hotel': <Hotel className="h-4 w-4" />,
  'calendar': <Calendar className="h-4 w-4" />,
  'trophy': <Trophy className="h-4 w-4" />,
  'book-open': <BookOpen className="h-4 w-4" />,
  'leaf': <Leaf className="h-4 w-4" />,
  'users': <Users className="h-4 w-4" />,
  'graduation-cap': <GraduationCap className="h-4 w-4" />,
  'accessibility': <Accessibility className="h-4 w-4" />,
  'folder': <Folder className="h-4 w-4" />,
  'tag': <Tag className="h-4 w-4" />,
};

export const CategorieAssociazioniPanel = () => {
  const navigate = useNavigate();
  const { categorie, isLoading: loadingCategorie } = useCategorieAssociazioni();

  // Fetch counts per category
  const { data: counts, isLoading: loadingCounts } = useQuery({
    queryKey: ['categorie-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('associazioni_terzo_settore')
        .select('categoria_id');

      if (error) throw error;

      const countMap: Record<string, number> = {};
      data?.forEach((a) => {
        if (a.categoria_id) {
          countMap[a.categoria_id] = (countMap[a.categoria_id] || 0) + 1;
        }
      });
      return countMap;
    },
  });

  const isLoading = loadingCategorie || loadingCounts;

  if (isLoading) {
    return (
      <Card className="ist-card">
        <CardHeader className="pb-2">
          <CardTitle className="ist-card-header">
            <Tag className="h-5 w-5" />
            Categorie Associazioni
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="ist-card">
      <CardHeader className="pb-2">
        <CardTitle className="ist-card-header">
          <Tag className="h-5 w-5" />
          Categorie Associazioni
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {categorie.map((cat) => {
            const count = counts?.[cat.id] || 0;
            return (
              <div
                key={cat.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-white hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => navigate(`/istituzionale/associazioni?categoria=${cat.id}`)}
                style={{ borderLeftColor: cat.colore, borderLeftWidth: '3px' }}
              >
                <div className="flex items-center gap-2">
                  <span style={{ color: cat.colore }}>
                    {iconMap[cat.icona] || <Tag className="h-4 w-4" />}
                  </span>
                  <span className="text-sm font-medium">{cat.nome}</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {count}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
