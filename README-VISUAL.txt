CANTUS DEI - NOVO VISUAL MUSICAL

Objetivo:
dar ao frontend uma identidade mais ligada a músicos, ministério,
liturgia e palco, reduzindo a aparência de painel administrativo.

A referência Wix foi usada apenas como inspiração de linguagem visual.
O layout do Cantus Dei é original.

ARQUIVOS ALTERADOS

apps/web/src/styles.css
apps/web/src/components/PsalmHighlight.tsx
apps/web/src/components/GroupHeader.tsx
apps/web/src/pages/Login.tsx
apps/web/src/pages/Registrar.tsx
apps/web/src/pages/Dashboard.tsx
apps/web/src/pages/GrupoHome.tsx

O QUE MUDA

- fundo escuro cinematográfico
- dourado como cor de destaque
- tipografia editorial
- elementos gráficos ligados à música
- menos cartões brancos
- hero musical no dashboard
- home do grupo com aparência de ministério
- Salmo em destaque na página principal
- Salmo muda automaticamente de acordo com o dia
- login com identidade musical
- responsivo para celular/tablet
- não altera API nem banco

COMO APLICAR

1. Extraia por cima de:
D:\GitHub\cantus-dei

2. Execute:
npm run build

3. Se o build passar:
git add .
git commit -m "Renova visual musical do Cantus Dei"
git push origin main

Não é necessário executar SQL.
Não é necessário alterar Render.
Não é necessário criar variável de ambiente.
