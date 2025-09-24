import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Trash2 } from 'lucide-react';

interface ClearHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ClearHistoryDialog: React.FC<ClearHistoryDialogProps> = ({ open, onOpenChange }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleClearHistory = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('reading_progress')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Histórico limpo!',
        description: 'Todo seu histórico de leitura foi removido'
      });

      onOpenChange(false);
      // Recarrega a página para atualizar os dados
      window.location.reload();
    } catch (error) {
      console.error('Erro ao limpar histórico:', error);
      toast({
        title: 'Erro ao limpar histórico',
        description: 'Tente novamente',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Limpar Histórico de Leitura
          </AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja apagar todo o seu histórico de leitura? 
            Esta ação não pode ser desfeita e você perderá:
            <br /><br />
            • Progresso de leitura de todos os mangás
            <br />
            • Páginas onde parou em cada capítulo
            <br />
            • Histórico de mangás lidos
            <br /><br />
            <strong>Esta ação é permanente!</strong>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleClearHistory}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? 'Apagando...' : 'Sim, apagar tudo'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};