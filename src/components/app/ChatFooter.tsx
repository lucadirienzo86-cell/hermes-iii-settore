import { useState, useRef } from 'react';
import { Send, Paperclip, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface HersChatFooterProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  praticaId: string;
  tipoUtente?: string;
}

export const HersChatFooter = ({ onSendMessage, disabled, praticaId, tipoUtente = 'azienda' }: HersChatFooterProps) => {
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${praticaId}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('pratiche-documenti')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { error: dbError } = await supabase
          .from('pratiche_documenti')
          .insert({
            pratica_id: praticaId,
            file_path: fileName,
            file_name: file.name,
            mime_type: file.type,
            file_size: file.size,
            uploaded_by: (await supabase.auth.getUser()).data.user?.id,
            user_type: tipoUtente
          });

        if (dbError) throw dbError;
      }

      toast.success('Allegato caricato');
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Errore durante il caricamento');
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border/50 px-4 py-3 max-w-lg mx-auto"
    >
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        {/* Attachment button */}
        <button
          type="button"
          onClick={handleFileClick}
          disabled={uploading}
          className={cn(
            "w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0",
            "hover:bg-muted/70 transition-colors disabled:opacity-50"
          )}
        >
          {uploading ? (
            <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
          ) : (
            <Paperclip className="w-5 h-5 text-muted-foreground" />
          )}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="*/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Message input */}
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Scrivi un messaggio..."
          disabled={disabled}
          className={cn(
            "flex-1 px-4 py-2.5 rounded-full bg-muted text-foreground",
            "placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-primary/30",
            "transition-shadow"
          )}
        />

        {/* Send button */}
        <button
          type="submit"
          disabled={disabled || !message.trim()}
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all",
            message.trim() 
              ? "bg-primary text-primary-foreground hover:opacity-90" 
              : "bg-muted text-muted-foreground"
          )}
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </motion.div>
  );
};

// Keep old export for compatibility
export const ChatFooter = HersChatFooter;
