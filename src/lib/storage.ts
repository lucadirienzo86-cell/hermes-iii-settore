import { supabase } from '@/integrations/supabase/client';
import { FileText, FileImage, FileSpreadsheet, File, FileArchive } from 'lucide-react';

export interface PraticaDocumento {
  id: string;
  pratica_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  user_type: string;
  note?: string;
  created_at: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'application/zip',
  'application/x-zip-compressed'
];

export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_+/g, '_')
    .toLowerCase();
};

export const generateUniqueFilename = (originalFilename: string): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = originalFilename.split('.').pop();
  const nameWithoutExt = originalFilename.replace(/\.[^/.]+$/, '');
  const sanitizedName = sanitizeFilename(nameWithoutExt);
  return `${sanitizedName}_${timestamp}_${randomString}.${extension}`;
};

export const validateFile = (file: File): { valid: boolean; error?: string } => {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'Il file supera la dimensione massima di 10MB' };
  }
  
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { valid: false, error: 'Tipo di file non supportato' };
  }
  
  return { valid: true };
};

export const uploadPraticaDocument = async (
  praticaId: string,
  file: File,
  userId: string,
  userType: string,
  note?: string
): Promise<{ success: boolean; error?: string; documentId?: string }> => {
  try {
    const validation = validateFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const uniqueFilename = generateUniqueFilename(file.name);
    const filePath = `${praticaId}/${uniqueFilename}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('pratiche-documenti')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return { success: false, error: 'Errore durante il caricamento del file' };
    }

    // Save metadata to database
    const { data, error: dbError } = await supabase
      .from('pratiche_documenti')
      .insert({
        pratica_id: praticaId,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        uploaded_by: userId,
        user_type: userType,
        note: note || null
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      // Try to cleanup uploaded file
      await supabase.storage.from('pratiche-documenti').remove([filePath]);
      return { success: false, error: 'Errore durante il salvataggio dei dati' };
    }

    return { success: true, documentId: data.id };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: 'Errore imprevisto durante il caricamento' };
  }
};

export const downloadPraticaDocument = async (
  filePath: string
): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    const { data, error } = await supabase.storage
      .from('pratiche-documenti')
      .createSignedUrl(filePath, 60); // 60 seconds expiry

    if (error) {
      console.error('Download error:', error);
      return { success: false, error: 'Errore durante il download del file' };
    }

    return { success: true, url: data.signedUrl };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: 'Errore imprevisto durante il download' };
  }
};

export const deletePraticaDocument = async (
  documentId: string,
  filePath: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('pratiche-documenti')
      .remove([filePath]);

    if (storageError) {
      console.error('Storage delete error:', storageError);
      return { success: false, error: 'Errore durante l\'eliminazione del file' };
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('pratiche_documenti')
      .delete()
      .eq('id', documentId);

    if (dbError) {
      console.error('Database delete error:', dbError);
      return { success: false, error: 'Errore durante l\'eliminazione dei dati' };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: 'Errore imprevisto durante l\'eliminazione' };
  }
};

export const getPraticaDocuments = async (
  praticaId: string
): Promise<{ success: boolean; documents?: PraticaDocumento[]; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('pratiche_documenti')
      .select('*')
      .eq('pratica_id', praticaId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch documents error:', error);
      return { success: false, error: 'Errore durante il caricamento dei documenti' };
    }

    return { success: true, documents: data || [] };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: 'Errore imprevisto' };
  }
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

export const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return FileImage;
  if (mimeType.includes('pdf')) return FileText;
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return FileSpreadsheet;
  if (mimeType.includes('zip')) return FileArchive;
  return File;
};
