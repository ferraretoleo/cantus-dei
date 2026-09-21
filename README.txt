CORREÇÃO TS18047 - GrupoHome.tsx

O TypeScript não preserva a garantia de que 'grupo' não é null dentro
da função assíncrona excluirGrupo().

A correção cria:
const grupoAtual = grupo;

logo após a validação:

if (!grupo || grupo.slug !== slug) {
  return <Navigate to="/dashboard" replace />;
}

Depois todas as referências usam grupoAtual.

APLICAÇÃO

1. Extraia por cima de:
D:\GitHub\cantus-dei

2. Execute:
npm run build

3. Se passar:
git add .
git commit -m "Corrige tipagem na exclusao de grupo"
git push origin main
