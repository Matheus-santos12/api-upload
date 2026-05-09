# api-upload

API em Fastify + TypeScript para upload e exclusão de arquivos com suporte a múltiplos backends de armazenamento (Local, AWS S3, Cloudflare R2). O upload é feito via URL pré-assinada (presigned URL).

## Status atual

- [x] Abstração genérica via interface `StorageProvider`
- [x] Implementação `LocalProvider` (armazenamento em disco)
- [x] Endpoints `POST /file/upload`, `PUT /_local/uploads/:key`, `DELETE /file/:fileId`
- [ ] Implementação `S3Provider` (não iniciada)
- [ ] Implementação `R2Provider` (não iniciada)

## Como rodar

```bash
npm install
mkdir uploads
npm run dev
```

O servidor sobe em `http://localhost:3333`.

## Endpoints

### `POST /file/upload`
Gera uma URL pré-assinada para o cliente subir o arquivo direto no storage.

**Body (JSON):**
```json
{
  "fileName": "exemplo.png",
  "contentType": "image/png"
}
```

**Resposta:**
```json
{
  "fileId": "uuid-gerado",
  "uploadUrl": "http://localhost:3333/_local/uploads/<key>"
}
```

### `PUT /_local/uploads/:key`
Endpoint interno do `LocalProvider` que recebe o arquivo enviado pela URL pré-assinada e grava no diretório `./uploads`. Em S3/R2 esse endpoint não existe — o cliente faz PUT diretamente no bucket.

**Body:** binário do arquivo.

**Resposta:** `204 No Content`.

### `DELETE /file/:fileId`
Remove o arquivo do storage e do registro em memória.

**Resposta:**
- `204 No Content` em caso de sucesso
- `404 Not Found` se o `fileId` não existir

## Fluxo de upload (passo a passo)

1. O cliente faz `POST /file/upload` enviando `fileName` e `contentType`.
2. A API chama `provider.generateUploadUrl(...)` e devolve `fileId` + `uploadUrl`.
3. A API guarda no `fileStore` (em memória) o mapeamento `fileId → { key, provider }`.
4. O cliente faz `PUT` na `uploadUrl` enviando o binário do arquivo.
5. No `LocalProvider`, o `PUT` é capturado pela rota `/_local/uploads/:key` e o arquivo é gravado em `./uploads/<key>`.

## Fluxo de exclusão

1. O cliente faz `DELETE /file/:fileId`.
2. A API busca no `fileStore` o registro pelo `fileId`.
3. Se existir, chama `provider.delete(record.key)` para apagar do storage.
4. Remove o registro do `fileStore`.

## Arquitetura

```
src/
├── server.ts                          # bootstrap do Fastify
├── store.ts                           # Map em memória: fileId → { key, provider }
├── routes/
│   └── file-routes.ts                 # POST, PUT, DELETE
└── support-providers/
    ├── storage-provider.ts            # interface (contrato)
    ├── local-provider.ts              # implementação local
    └── index.ts                       # factory que escolhe o provider ativo
```

A rota não conhece qual provider está sendo usado — ela só chama `provider.generateUploadUrl(...)` e `provider.delete(...)`. Quando S3 e R2 forem adicionados, basta criar `s3-provider.ts` / `r2-provider.ts` implementando a mesma interface e ajustar a factory para escolher via variável de ambiente. Nenhuma rota precisa mudar.

## Limitações conhecidas

- O `fileStore` é um `Map` em memória — os registros são perdidos quando o servidor reinicia. Em produção seria substituído por banco de dados.
- A URL pré-assinada do `LocalProvider` não tem expiração nem token de autenticação — qualquer cliente que conheça a `key` consegue fazer PUT no endpoint. Em produção seria simulada com JWT de curta duração ou hash assinado.
- Não há validação de schema do body (zod ou similar). O type assertion atual confia no cliente.
