import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, Plus, Minus, User } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface BadgeLog {
  id: string;
  azione: string;
  created_at: string;
  note: string | null;
  badge_tipi: {
    nome: string;
    colore: string | null;
  } | null;
  eseguito_da: string | null;
  profile?: {
    nome: string | null;
    cognome: string | null;
    email: string;
  } | null;
}

interface BadgeHistoryProps {
  entityType: "azienda" | "docente" | "collaboratore";
  entityId: string;
}

const BadgeHistory = ({ entityType, entityId }: BadgeHistoryProps) => {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["badge_log", entityType, entityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("badge_log")
        .select(`
          id,
          azione,
          created_at,
          note,
          eseguito_da,
          badge_tipi(nome, colore)
        `)
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      // Fetch profile info for each log entry
      const logsWithProfiles = await Promise.all(
        (data || []).map(async (log) => {
          if (log.eseguito_da) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("nome, cognome, email")
              .eq("id", log.eseguito_da)
              .maybeSingle();
            return { ...log, profile };
          }
          return { ...log, profile: null };
        })
      );

      return logsWithProfiles as BadgeLog[];
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-muted-foreground">
          Caricamento storico...
        </CardContent>
      </Card>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Storico Modifiche Badge
          </CardTitle>
        </CardHeader>
        <CardContent className="py-6 text-center text-muted-foreground">
          Nessuna modifica registrata
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          Storico Modifiche Badge
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {logs.map((log) => (
            <div 
              key={log.id} 
              className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border"
            >
              {/* Icon */}
              <div className={`p-1.5 rounded-full shrink-0 ${
                log.azione === 'assegnato' 
                  ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' 
                  : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {log.azione === 'assegnato' ? (
                  <Plus className="h-3.5 w-3.5" />
                ) : (
                  <Minus className="h-3.5 w-3.5" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">
                    Badge {log.azione === 'assegnato' ? 'assegnato' : 'rimosso'}:
                  </span>
                  <Badge 
                    style={{ backgroundColor: log.badge_tipi?.colore || "#3B82F6" }}
                    className="text-white text-xs"
                  >
                    {log.badge_tipi?.nome || "Badge eliminato"}
                  </Badge>
                </div>
                
                {/* User and date */}
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  {log.profile && (
                    <>
                      <User className="h-3 w-3" />
                      <span>
                        {log.profile.nome && log.profile.cognome 
                          ? `${log.profile.nome} ${log.profile.cognome}` 
                          : log.profile.email}
                      </span>
                      <span>•</span>
                    </>
                  )}
                  <span>
                    {format(new Date(log.created_at), "d MMM yyyy, HH:mm", { locale: it })}
                  </span>
                </div>

                {/* Notes */}
                {log.note && (
                  <p className="text-xs text-muted-foreground mt-1 italic">
                    "{log.note}"
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default BadgeHistory;
