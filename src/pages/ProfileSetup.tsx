import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const GENEROS_MANGA = [
  'Ação', 'Romance', 'Comédia', 'Drama', 'Fantasy', 'Sci-Fi', 
  'Horror', 'Terror', 'Mistério', 'Thriller', 'Aventura', 
  'Shoujo', 'Shounen', 'Seinen', 'Josei', 'Slice of Life',
  'Sobrenatural', 'Histórico', 'Psicológico', 'Ecchi'
];

const profileSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres'),
  idade: z.number().min(13, 'Idade mínima é 13 anos').max(120, 'Idade inválida'),
  preferencias: z.array(z.string()).min(1, 'Selecione pelo menos uma preferência'),
  conteudo_adulto: z.boolean()
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function ProfileSetup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<ProfileForm>({
    nome: '',
    idade: 13,
    preferencias: [],
    conteudo_adulto: false
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleIdadeChange = (idade: number) => {
    setFormData(prev => ({
      ...prev,
      idade,
      conteudo_adulto: idade >= 18 ? true : false
    }));
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

      // Validar dados
      const validatedData = profileSchema.parse(formData);

      // Inserir perfil no banco
      const { error } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          nome: validatedData.nome,
          idade: validatedData.idade,
          preferencias: validatedData.preferencias,
          conteudo_adulto: validatedData.conteudo_adulto
        });

      if (error) {
        // Check if it's a unique constraint violation
        if (error.code === '23505' && error.message.includes('profiles_nome_unique')) {
          setErrors({ nome: 'Este nome já está sendo usado por outro usuário' });
          return;
        }
        throw error;
      }

      toast({
        title: 'Perfil criado com sucesso!',
        description: 'Bem-vindo ao Culto do Demônio Celestial!'
      });

      navigate('/');
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
          title: 'Erro ao criar perfil',
          description: 'Tente novamente',
          variant: 'destructive'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const isAdult = formData.idade >= 18;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Configure seu Perfil</CardTitle>
          <CardDescription>
            Complete as informações abaixo para personalizar sua experiência
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
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

            <div className="space-y-2">
              <Label htmlFor="idade">Idade *</Label>
              <Input
                id="idade"
                type="number"
                min="13"
                max="120"
                value={formData.idade}
                onChange={(e) => handleIdadeChange(parseInt(e.target.value) || 13)}
                className={errors.idade ? 'border-destructive' : ''}
              />
              {errors.idade && <p className="text-sm text-destructive">{errors.idade}</p>}
            </div>

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

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="conteudo_adulto"
                  checked={formData.conteudo_adulto}
                  disabled={!isAdult}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, conteudo_adulto: !!checked }))
                  }
                />
                <Label htmlFor="conteudo_adulto" className="text-sm">
                  Visualizar conteúdo adulto (+18)
                </Label>
              </div>
              {!isAdult && (
                <p className="text-xs text-muted-foreground">
                  * Disponível apenas para usuários com 18 anos ou mais
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Criando perfil...' : 'Criar Perfil'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}