import { cn } from '@/lib/utils';
import { Download, FileText, Image as ImageIcon, File, Check, CheckCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { motion } from 'framer-motion';

interface Allegato {
  id: string;
  file_name: string;
  file_path: string;
  mime_type: string;
  file_size: number;
  created_at: string;
}

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  timestamp?: string;
  senderName?: string;
  allegati?: Allegato[];
  isRead?: boolean;
}

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return ImageIcon;
  if (mimeType.includes('pdf')) return FileText;
  return File;
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  return format(date, 'HH:mm', { locale: it });
};

export const HersChatMessage = ({ 
  message, 
  isUser,
  timestamp,
  senderName,
  allegati = [],
  isRead = false
}: ChatMessageProps) => {
  
  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('pratiche-documenti')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Download avviato');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Errore durante il download');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn(
        "flex mb-3",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div className={cn(
        "max-w-[80%] rounded-3xl px-4 py-3 relative",
        isUser 
          ? "bg-foreground text-background rounded-br-lg" 
          : "bg-muted text-foreground rounded-bl-lg"
      )}>
        {/* Sender name for non-user messages */}
        {!isUser && senderName && (
          <p className="text-[10px] font-medium text-primary mb-1">
            {senderName}
          </p>
        )}
        
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message}</p>
        
        {/* Attachments */}
        {allegati && allegati.length > 0 && (
          <div className="mt-2 space-y-1.5">
            {allegati.map((allegato) => {
              const Icon = getFileIcon(allegato.mime_type);
              return (
                <div
                  key={allegato.id}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-xl cursor-pointer transition-colors",
                    isUser 
                      ? "bg-background/10 hover:bg-background/20" 
                      : "bg-background/50 hover:bg-background/70"
                  )}
                  onClick={() => handleDownload(allegato.file_path, allegato.file_name)}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{allegato.file_name}</p>
                    <p className="text-[10px] opacity-70">{formatFileSize(allegato.file_size)}</p>
                  </div>
                  <Download className="w-4 h-4 flex-shrink-0 opacity-60" />
                </div>
              );
            })}
          </div>
        )}
        
        {/* Timestamp and read status */}
        <div className={cn(
          "flex items-center gap-1 mt-1",
          isUser ? "justify-end" : "justify-start"
        )}>
          {timestamp && (
            <span className="text-[10px] opacity-50">
              {formatTimestamp(timestamp)}
            </span>
          )}
          {isUser && (
            isRead 
              ? <CheckCheck className="w-3 h-3 opacity-50" />
              : <Check className="w-3 h-3 opacity-50" />
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Keep old export for compatibility
export const ChatMessage = HersChatMessage;
