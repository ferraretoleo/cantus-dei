CORREÇÃO TS18047 - PAROQUIA ATIVA

Arquivos corrigidos:
- apps/web/src/pages/Dashboard.tsx
- apps/web/src/pages/NovoGrupo.tsx
- apps/web/src/pages/ParoquiaAdmin.tsx

Causa:
O TypeScript não preservava a garantia de que paroquiaAtiva não era null
dentro das funções assíncronas.

Correção:
Após:
if (!paroquiaAtiva) {
  return <Navigate to="/paroquias" replace />;
}

foi criada uma referência estável:
const paroquiaAtual = paroquiaAtiva;

Todas as funções passam a usar paroquiaAtual.

APLICAÇÃO

1. Extraia por cima de:
D:\GitHub\cantus-dei

2. Execute:
npm run build

3. Se passar:
git add .
git commit -m "Corrige tipagem da paroquia ativa"
git push origin main

Não precisa executar SQL.
