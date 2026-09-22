CORREÇÃO TS18047 - GROUPHEADER

Erro corrigido:
src/components/GroupHeader.tsx
'grupo' is possibly 'null'

Causa:
O TypeScript não preservava a garantia de que grupo não era null
dentro da função rotuloPapel().

Correção:
Após a validação:

if (!grupo || grupo.slug !== slug) {
  return null;
}

foi criada a referência:

const grupoAtual = grupo;

O componente passa a utilizar grupoAtual.

COMO APLICAR

Extraia por cima de:
D:\GitHub\cantus-dei

Depois execute:
npm run build

Se passar:
git add .
git commit -m "Corrige tipagem do GroupHeader"
git push origin main

Não precisa executar SQL.
