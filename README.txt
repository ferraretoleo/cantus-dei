CANTUS DEI - PARTITURA SEM PDF / SEM R2

Esta versão deixa o módulo de músicas funcional sem armazenamento de arquivos.

RECURSOS

- Cadastro de música
- Letra
- Cifra
- Partitura em ABC Notation
- Pré-visualização da partitura
- Impressão da partitura
- Tom original
- BPM
- Compasso
- Vídeo de referência
- Tags
- Observações
- Edição
- Exclusão lógica
- Busca por título

Nenhum cartão, R2 ou armazenamento externo é necessário.

PASSO 1 - NEON

Abra o SQL Editor e execute:

database/001_add_notacao_abc.sql

PASSO 2 - ARQUIVOS

Extraia este ZIP na raiz:

D:\GitHub\cantus-dei

Aceite substituir os arquivos.

PASSO 3 - DEPENDÊNCIA

Execute:

npm install

Isso instalará abcjs no frontend.

PASSO 4 - BUILD

npm run build -w @cantus-dei/shared
npm run build -w @cantus-dei/api
npm run build -w @cantus-dei/web

PASSO 5 - PUBLICAÇÃO

git add .
git commit -m "Adiciona partituras ABC sem storage externo"
git push origin main

EXEMPLO ABC

X:1
T:Exemplo de Partitura
M:4/4
L:1/4
Q:1/4=90
K:C
C D E F | G A G2 | F E D C | C4 |

A aplicação renderiza isso como pentagrama musical.
