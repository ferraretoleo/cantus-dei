CANTUS DEI - LOGO DA PARÓQUIA + DATASHOW V7

OBJETIVOS

1. Permitir cadastrar uma logo para cada paróquia.
2. Usar a logo na geração do QR Code.
3. Exibir a logo no Modo Palco técnico.
4. Criar um modo visual próprio para DATASHOW usando somente a LETRA.
5. Manter Cifra e Partitura como modos técnicos para os músicos.

ARMAZENAMENTO DA LOGO

A logo é:
- selecionada em PNG/JPG/WEBP
- redimensionada automaticamente no navegador
- convertida para WEBP
- armazenada em Base64 no Neon

Isso evita R2/S3 e mantém o projeto sem custo adicional.

A logo é limitada no backend para evitar imagens excessivamente grandes.

CADASTRO DA PARÓQUIA

No MASTER GLOBAL:

Nova Paróquia
- Nome
- Cidade
- Endereço
- Logo da paróquia

É exibida uma prévia antes de cadastrar.

PARÓQUIA EXISTENTE

Ao selecionar uma paróquia na Administração Global:
- mostra a logo atual
- permite trocar a logo
- permite remover a logo

QR CODE

O QR Code da celebração agora utiliza:
- nível de correção H
- logo da paróquia no centro
- fundo branco atrás da logo para preservar leitura

Se uma paróquia ainda não possuir logo, o QR continua funcionando normalmente.

MODO PALCO TÉCNICO

CIFRA e PARTITURA são voltadas aos músicos.

O cabeçalho mostra:
- logo da paróquia
- nome da paróquia/ministério
- momento
- música

DATASHOW

Ao selecionar LETRA, o botão aparece como:

DATASHOW

Esse modo é preparado para projeção aos fiéis:
- fundo escuro com degradê discreto
- letra grande
- texto centralizado
- alto contraste
- título da música
- momento litúrgico
- logo da paróquia
- marca d'água suave da logo
- nome do ministério no rodapé
- paginação automática
- continuação automática quando a letra não cabe em uma tela

No Datashow NÃO aparecem:
- cifras
- tom
- observações técnicas
- partitura

A navegação continua disponível para o operador:
Anterior / Próxima

MODO TELA CHEIA

O sistema continua tentando abrir em tela cheia automaticamente.
Quando o navegador impedir, aparece o botão "Tela cheia".

ARQUIVOS NOVOS / ALTERADOS

Banco:
- database/006_logo_paroquia.sql

API:
- apps/api/src/db/schema.ts
- apps/api/src/routes/parish-brand.ts
- apps/api/src/routes/public.ts

Frontend:
- apps/web/src/lib/qrWithLogo.ts
- apps/web/src/pages/ModoPalco.tsx

Patch automático:
- APLICAR-LOGO-PAROQUIA-V7.py

O patch ajusta:
- apps/api/src/server.ts
- apps/web/src/pages/MasterAdmin.tsx
- apps/web/src/pages/Calendario.tsx

ORDEM CORRETA DE INSTALAÇÃO

1. Faça backup do Neon.

2. No Neon SQL Editor execute:
database/006_logo_paroquia.sql

3. Extraia este ZIP por cima de:
D:\GitHub\cantus-dei

4. Na raiz execute:
python APLICAR-LOGO-PAROQUIA-V7.py

5. Depois:
npm run build

6. Se passar:
git add .
git commit -m "Adiciona logo da paroquia e modo datashow"
git push origin main

7. Aguarde o deploy do Render e Cloudflare.

OBSERVAÇÃO

Depois do deploy, entre como MASTER GLOBAL e:
- selecione a paróquia
- envie a logo
- clique Salvar logo

A partir daí o Modo Palco e os novos QR Codes usarão essa identidade visual.
