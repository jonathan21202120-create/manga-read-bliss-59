import React, { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Camera, Loader2 } from 'lucide-react';
import { z } from 'zod';

const GENEROS_MANGA = [
  'Ação', 'Romance', 'Comédia', 'Drama', 'Fantasy', 'Sci-Fi', 
  'Horror', 'Terror', 'Mistério', 'Thriller', 'Aventura', 
  'Shoujo', 'Shounen', 'Seinen', 'Josei', 'Slice of Life',
  'Sobrenatural', 'Histórico', 'Psicológico', 'Ecchi'
];

const profileUpdateSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres'),
  preferencias: z.array(z.string()).min(1, 'Selecione pelo menos uma preferência'),
  conteudo_adulto: z.boolean()
});

interface ProfileEditFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProfileEditForm: React.FC<ProfileEditFormProps> = ({ open, onOpenChange }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    nome: user?.profile?.nome || '',
    preferencias: user?.profile?.preferencias || [],
    conteudo_adulto: user?.profile?.conteudo_adulto || false,
    avatar_url: user?.profile?.avatar_url || ''
  });
  
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'A foto deve ter no máximo 5MB',
        variant: 'destructive'
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Formato inválido',
        description: 'Selecione apenas arquivos de imagem',
        variant: 'destructive'
      });
      return;
    }

    try {
      setUploadingPhoto(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
      
      toast({
        title: 'Foto carregada!',
        description: 'Sua foto foi carregada com sucesso'
      });
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: 'Erro no upload',
        description: 'Não foi possível carregar a foto',
        variant: 'destructive'
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handlePreferenciaToggle = (genero: string) => {
    setFormData(prev => ({
      ...prev,
      preferencias: prev.preferencias.includes(genero)
        ? prev.preferencias.filter(p => p !== genero)
        : [...prev.preferencias, genero]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);
      setErrors({});

      const validatedData = profileUpdateSchema.parse(formData);

      const { error } = await supabase
        .from('profiles')
        .update({
          nome: validatedData.nome,
          preferencias: validatedData.preferencias,
          conteudo_adulto: validatedData.conteudo_adulto,
          avatar_url: formData.avatar_url || null
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Perfil atualizado!',
        description: 'Suas informações foram salvas com sucesso'
      });

      onOpenChange(false);
      window.location.reload(); // Recarrega para atualizar o contexto
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.issues.forEach(err => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        toast({
          title: 'Erro ao atualizar',
          description: 'Tente novamente',
          variant: 'destructive'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Perfil</DialogTitle>
          <DialogDescription>
            Atualize suas informações pessoais e preferências
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="w-24 h-24 border-4 border-primary">
                <AvatarImage src={formData.avatar_url} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                  {formData.nome?.split(' ').map(n => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="absolute -bottom-2 -right-2 rounded-full p-2"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
              >
                {uploadingPhoto ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            <p className="text-sm text-muted-foreground">
              Clique no ícone para alterar sua foto
            </p>
          </div>

          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
              placeholder="Seu nome"
              className={errors.nome ? 'border-destructive' : ''}
            />
            {errors.nome && <p className="text-sm text-destructive">{errors.nome}</p>}
          </div>

          {/* Idade (apenas para exibição) */}
          <div className="space-y-2">
            <Label>Idade</Label>
            <Input
              value={user?.profile?.idade || ''}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              A idade não pode ser alterada
            </p>
          </div>

          {/* Preferências */}
          <div className="space-y-3">
            <Label>Preferências de Gênero *</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {GENEROS_MANGA.map(genero => (
                <div key={genero} className="flex items-center space-x-2">
                  <Checkbox
                    id={genero}
                    checked={formData.preferencias.includes(genero)}
                    onCheckedChange={() => handlePreferenciaToggle(genero)}
                  />
                  <Label 
                    htmlFor={genero} 
                    className="text-sm font-normal cursor-pointer"
                  >
                    {genero}
                  </Label>
                </div>
              ))}
            </div>
            {errors.preferencias && <p className="text-sm text-destructive">{errors.preferencias}</p>}
          </div>

          {/* Conteúdo Adulto */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="conteudo_adulto"
                checked={formData.conteudo_adulto}
                disabled={!user?.profile?.idade || user.profile.idade < 18}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, conteudo_adulto: !!checked }))
                }
              />
              <Label htmlFor="conteudo_adulto" className="text-sm">
                Visualizar conteúdo adulto (+18)
              </Label>
            </div>
            {user?.profile?.idade && user.profile.idade < 18 && (
              <p className="text-xs text-muted-foreground">
                * Disponível apenas para usuários com 18 anos ou mais
              </p>
            )}
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};