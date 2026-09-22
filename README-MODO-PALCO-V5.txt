CANTUS DEI - MODO PALCO V5

ALTERAÇÕES

1. TELA CHEIA
Ao abrir o Modo Palco, o sistema tenta entrar automaticamente
em Fullscreen usando a Fullscreen API.

Alguns navegadores exigem interação do usuário para permitir
tela cheia. Nesses casos aparece o botão:
"Tela cheia"

2. SEM SOBREPOSIÇÃO
O layout foi reorganizado usando:
- header fixo dentro do flex
- área central flexível
- footer com altura reservada

A cifra/letra nunca fica atrás da barra de navegação inferior.

3. PAGINAÇÃO DE CIFRA E LETRA
A cifra ou letra é dividida automaticamente conforme:
- altura da tela
- largura da tela
- tamanho do texto

Quando uma música precisa de várias telas:

ENTRADA
Entrada · continuação 2/3
Entrada · continuação 3/3

O botão Próxima percorre primeiro as telas da mesma música.
Somente depois avança para a próxima música/momento.

O botão Anterior faz o processo inverso.

4. MODOS DO PALCO
Quando o cadastro possuir conteúdo, aparecem opções:

[Cifra] [Letra] [Partitura]

A preferência escolhida fica salva no navegador.

5. PARTITURA
A partitura utiliza o AbcScore em modo palco:
- sem botão "Imprimir partitura"
- aproveita a largura disponível
- possui rolagem interna apenas dentro da área da partitura
- nunca fica embaixo da barra inferior

6. RESPONSIVIDADE
Foi ajustado para:
- notebook
- desktop
- tablet
- celular

ARQUIVOS
- apps/web/src/pages/ModoPalco.tsx
- apps/web/src/components/AbcScore.tsx

BANCO/API
Nenhuma alteração.
Não precisa executar SQL.
Não precisa alterar Render.

APLICAÇÃO

Extraia por cima de:
D:\GitHub\cantus-dei

Depois:
npm run build

Se passar:
git add .
git commit -m "Melhora modo palco com tela cheia e paginacao"
git push origin main
