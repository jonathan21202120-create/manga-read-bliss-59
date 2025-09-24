# Sistema de Upload Local

## Visão Geral

O sistema de upload foi modificado para armazenar arquivos na hospedagem do domínio ao invés do Supabase Storage.

## Implementação Atual

### Hook `useLocalFileUpload`

Localizado em `src/hooks/useLocalFileUpload.ts`, este hook substitui o `useFileUpload` anterior e oferece:

- **Upload de arquivo único**: `uploadFile(file, options)`
- **Upload múltiplo**: `uploadMultipleFiles(files, options)`
- **Remoção de arquivos**: `deleteFile(path)`
- **Estados de loading**: `isUploading`, `uploadProgress`

### Diferenças do Sistema Anterior

1. **Não usa buckets**: Removido o parâmetro `bucket` das opções
2. **URLs locais**: Retorna blob URLs para uso imediato
3. **Estrutura de pastas**: Organiza por `folder` (ex: `manga-covers`, `manga-123/chapter-1`)

### Configuração de Opções

```typescript
interface UploadOptions {
  folder?: string; // Pasta de destino (padrão: 'uploads')
  maxSizeBytes?: number; // Tamanho máximo (padrão: 10MB)
  allowedTypes?: string[]; // Tipos permitidos (padrão: todos)
}
```

## Arquivos Atualizados

- `src/pages/admin/MangaForm.tsx` - Upload de capas
- `src/pages/admin/ChapterManager.tsx` - Upload de páginas
- `src/hooks/useLocalFileUpload.ts` - Novo hook de upload

## Estrutura de Pastas Sugerida

```
public/
├── uploads/
│   ├── manga-covers/
│   │   ├── timestamp_random.jpg
│   │   └── ...
│   └── manga-{id}/
│       ├── chapter-1/
│       │   ├── timestamp_random.jpg
│       │   └── ...
│       └── chapter-2/
│           └── ...
```

## Próximos Passos

Para implementação completa em produção:

1. **Endpoint de Upload**: Criar endpoint no servidor para receber arquivos
2. **Gestão de Arquivos**: Implementar limpeza de arquivos antigos
3. **CDN**: Configurar CDN para servir imagens otimizadas
4. **Backup**: Sistema de backup dos arquivos

## Migração

Arquivos já existentes no Supabase Storage precisarão ser migrados para o novo sistema local.