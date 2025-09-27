import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, Calendar } from "lucide-react";

interface AgeGateModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function AgeGateModal({ isOpen, onOpenChange, onConfirm }: AgeGateModalProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = () => {
    setIsConfirming(true);
    setTimeout(() => {
      onConfirm();
      onOpenChange(false);
      setIsConfirming(false);
    }, 1000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-manga-surface-elevated border-border/50">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center">
            <Shield className="h-8 w-8 text-orange-400" />
          </div>
          
          <DialogTitle className="text-xl font-bold text-manga-text-primary">
            Verificação de Idade
          </DialogTitle>
          
          <DialogDescription className="text-manga-text-secondary">
            O conteúdo +18 contém material adulto que pode não ser apropriado para menores de idade.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Warning Badge */}
          <Badge className="w-full justify-center bg-orange-500/20 text-orange-400 border-orange-500/30 py-2">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Conteúdo para maiores de 18 anos
          </Badge>

          {/* Age Confirmation */}
          <div className="bg-manga-surface p-4 rounded-lg border border-border/30">
            <div className="flex items-center gap-3 mb-3">
              <Calendar className="h-5 w-5 text-manga-primary" />
              <span className="font-semibold text-manga-text-primary">Confirmação de Idade</span>
            </div>
            
            <p className="text-sm text-manga-text-secondary mb-4">
              Ao continuar, você confirma que tem 18 anos ou mais e concorda em visualizar conteúdo adulto.
            </p>
            
            <div className="text-xs text-manga-text-muted">
              • Este acesso será válido apenas para esta sessão<br />
              • O conteúdo +18 não aparecerá nos rankings públicos<br />
              • Você pode desativar a qualquer momento
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="manga-outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isConfirming}
            >
              Cancelar
            </Button>
            
            <Button
              variant="manga"
              className="flex-1"
              onClick={handleConfirm}
              disabled={isConfirming}
            >
              {isConfirming ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Confirmando...
                </div>
              ) : (
                "Tenho 18+ anos"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}