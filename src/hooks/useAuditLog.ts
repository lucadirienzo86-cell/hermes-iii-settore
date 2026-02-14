import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AuditLogEntry {
  id: string;
  entity_type: string;
  entity_id: string;
  azione: string;
  dettagli: Record<string, unknown> | null;
  eseguito_da: string | null;
  created_at: string;
}

export const useAuditLog = (entityType?: string, entityId?: string) => {
  return useQuery({
    queryKey: ['audit-log', entityType, entityId],
    queryFn: async () => {
      let query = supabase
        .from('audit_log_terzo_settore')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (entityType) {
        query = query.eq('entity_type', entityType);
      }
      if (entityId) {
        query = query.eq('entity_id', entityId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as AuditLogEntry[];
    },
  });
};

export const useRecentAuditLog = (limit: number = 20) => {
  return useQuery({
    queryKey: ['audit-log-recent', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_log_terzo_settore')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as AuditLogEntry[];
    },
  });
};
