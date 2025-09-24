export interface Profile {
  id: number;
  user_id: string;
  nome: string;
  idade: number;
  preferencias: string[];
  conteudo_adulto: boolean;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}