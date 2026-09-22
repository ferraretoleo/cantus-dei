CANTUS DEI - CELEBRAÇÕES V6

OBJETIVO
Unificar a edição da celebração e transformar o calendário
em uma agenda mensal visual semelhante ao Outlook.

FLUXO DA CELEBRAÇÃO

1. Nova celebração
O usuário autorizado preenche tudo na mesma tela:
- data e hora
- local
- tipo de celebração
- tempo litúrgico
- observações
- momentos utilizados
- músicas do repertório
- músicas repetidas no mesmo momento
- escala dos músicos

2. UM ÚNICO BOTÃO DE SALVAR
Foi removida a necessidade de:
- Salvar dados
- Salvar repertório
- Salvar escala

Agora existe somente:
SALVAR CELEBRAÇÃO

Esse botão grava:
- dados principais
- repertório
- escala

3. PUBLICAR CELEBRAÇÃO
Existe um botão separado:
PUBLICAR CELEBRAÇÃO

Antes de publicar, o frontend valida:
- data e hora
- local
- tipo de celebração
- pelo menos uma música no repertório
- todos os itens com momento e música
- pelo menos um músico escalado

A API faz a validação novamente antes de publicar.

4. APÓS PUBLICAR
A página é redirecionada automaticamente para o calendário.

A celebração recém-publicada aparece destacada e são mostrados:
- link público
- copiar link
- WhatsApp
- modo palco
- QR Code

5. CALENDÁRIO ESTILO OUTLOOK
A tela Celebrações agora possui:
- grade mensal de domingo a sábado
- mês anterior
- hoje
- próximo mês
- celebrações dentro de cada dia
- horário e tipo da celebração
- destaque da celebração recém-publicada
- agenda detalhada abaixo do calendário

6. EXCLUSÃO DE CELEBRAÇÃO
Podem excluir:
- MASTER GLOBAL
- ADMIN_PAROQUIA
- RESPONSAVEL DO MINISTÉRIO

A exclusão utiliza a rota já existente e arquiva a celebração,
retirando-a do calendário.

7. PERMISSÕES
Podem salvar/publicar/excluir celebrações:
- MASTER GLOBAL
- ADMIN_PAROQUIA
- RESPONSAVEL DO MINISTÉRIO

Músicos e coordenadores podem visualizar conforme as permissões
já existentes, mas não administram a celebração.

8. MOMENTOS ESPECIAIS
O ADMIN_PAROQUIA ou MASTER pode criar momentos especiais
diretamente durante a preparação da celebração.

O momento fica disponível ao ministério e pode ser usado
imediatamente no repertório.

ARQUIVOS ALTERADOS
- apps/api/src/routes/missas.ts
- apps/web/src/pages/MissaEditor.tsx
- apps/web/src/pages/Calendario.tsx

BANCO
Não precisa executar SQL.
Não altera Neon.
Não altera schema.

COMO APLICAR

Extraia sobre:
D:\GitHub\cantus-dei

Depois:
npm run build

Se passar:
git add .
git commit -m "Unifica salvamento e cria calendario mensal de celebracoes"
git push origin main
