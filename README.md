# Tessera

Plataforma de eventos e ingressos com reserva, pagamento simulado e validação de entrada por QR code assinado.

## Stack

- **Client:** Vite, React, TypeScript
- **Server:** Express, TypeScript
- **Banco:** Supabase (Postgres), com Supabase Auth para os três papéis (organizador, cliente, portaria)
- **Catálogo externo:** Ticketmaster Discovery API
- **QR code:** assinado com HMAC no backend

## Estrutura do repositório

```
client/   front-end (Vite + React)
server/   API (Express), incluindo server/db/schema.sql
```

## Configuração do banco de dados (Supabase)

O projeto Supabase é criado manualmente pelo painel, sem CLI.

1. Crie um projeto novo em [supabase.com](https://supabase.com).
2. No painel, vá em **Project Settings > API** e copie a **Project URL** e a **service_role key**.
3. Dentro de `server/`, copie `.env.example` para `.env` e cole essas duas credenciais nas variáveis `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`.
4. Ainda no painel, abra o **SQL Editor**, cole o conteúdo inteiro de `server/db/schema.sql` e execute. Isso cria as tabelas, os enums, os índices, o gatilho que espelha novos usuários do Auth para a tabela pública `users`, e a função de custom claim de papel (role).
5. Registre a função de custom claim manualmente: vá em **Authentication > Hooks**, adicione um hook do tipo **Customize Access Token (Auth) Hook** e selecione a função `custom_access_token_hook`. Isso faz o papel do usuário (organizador, cliente ou portaria) viajar dentro do JWT, sem precisar consultar o banco em toda requisição.

## Como rodar localmente

### Server

```
cd server
npm install
npm run dev
```

Sobe em `http://localhost:3333`. Rota `GET /health` confirma que está no ar.

### Client

```
cd client
npm install
npm run dev
```

## Contas de teste

| Email | Senha | Papel |
|---|---|---|
| `preview.organizer@tessera.dev` | `Preview123!` | Organizador |
| `preview.organizer2@tessera.dev` | `Preview123!` | Organizador |
| `preview.customer@tessera.dev` | `Preview123!` | Cliente |
| `preview.customer2@tessera.dev` | `Preview123!` | Cliente |
| `preview.portaria@tessera.dev` | `Preview123!` | Portaria |

O catálogo está dividido entre os dois organizadores de propósito, não por acaso: `preview.organizer` é dono da maior parte dos eventos, importados em lote por um script de população que passa pela própria API autenticada de criação de evento (não por inserção direta no banco). `preview.organizer2` tem só alguns eventos, criados manualmente fora desse fluxo, incluindo os que têm descrição completa preenchida. Essa divisão deixa fácil testar que cada organizador só vê e edita os próprios eventos no painel.

## Limitações conhecidas

**Descrição dos eventos:** a maioria dos eventos importados do catálogo do Ticketmaster não tem o campo de descrição preenchido, porque a resposta da Discovery API pra busca de eventos não traz um texto descritivo, só título, imagem, local, data e categoria. Os eventos criados manualmente por `preview.organizer2` têm descrição completa, servindo de exemplo do campo funcionando de ponta a ponta.

**Categorias na busca por IA:** a extração de categoria em `POST /api/chat/suggest` usa uma lista fixa de valores no prompt (`Música`, `Artes e Teatro`, `Esportes`, `Variado`), que reflete a taxonomia de segmentos do Ticketmaster observada no catálogo. Essa mesma limitação já existe em `client/src/utils/matchesCategory.ts`, usado nos filtros de categoria da Home e da listagem de eventos. Se o catálogo passar a trazer categorias fora dessa lista, o prompt em `server/src/services/gemini.ts` precisa ser atualizado manualmente.

## Status atual

Neste momento o repositório tem só o scaffold dos dois projetos e o schema do banco. Autenticação, CRUD de evento, reserva, pagamento simulado, geração de ingresso e portaria ainda não foram implementados, entram nos próximos commits conforme o cronograma do desafio.
