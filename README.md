# Cantus Dei

Fase inicial do sistema para grupos de música litúrgica católica.

## Implementado nesta entrega

1. Monorepo com `apps/web`, `apps/api` e `packages/shared`.
2. Schema PostgreSQL completo do domínio previsto, migration inicial e seed dos 12 momentos litúrgicos globais.
3. Autenticação por e-mail/senha com Argon2 + JWT.
4. Criação de grupos, vínculo automático do criador como `RESPONSAVEL`, listagem dos grupos do usuário e convites.
5. Guard central `requireGroupAccess`, que valida associação ativa ao grupo antes da rota de conteúdo.

## Rodar localmente

```bash
cp .env.example .env
npm install
npm run db:migrate
npm run db:seed
npm run dev:api
npm run dev:web
```

Use uma connection string Neon pooled contendo `-pooler` no host e `sslmode=require`.

## Regra de isolamento

Rotas de conteúdo de grupo não devem consultar `grupo_id` livremente. Elas passam por `requireGroupAccess`, que valida `grupo_membros` para o usuário autenticado. As queries de cada módulo devem então usar `request.groupAccess.grupoId` como escopo obrigatório.

## Permissões

| Ação | RESPONSAVEL | COORDENADOR | MUSICO |
|---|---:|---:|---:|
| Editar grupo / membros | Sim | Não | Não |
| Criar, editar e publicar missas | Sim | Sim | Não |
| Cadastrar músicas / partituras | Sim | Sim | Não por padrão |
| Ver calendário e repertório | Sim | Sim | Sim |
| Confirmar presença | Sim | Sim | Sim |
