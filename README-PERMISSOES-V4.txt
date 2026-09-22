CANTUS DEI - PERMISSÕES V4

HIERARQUIA

1. MASTER GLOBAL
   - acesso a tudo, em todas as paróquias e ministérios

2. ADMIN_PAROQUIA
   - administra a paróquia
   - cria grupos
   - cria momentos
   - cria celebrações em qualquer ministério da paróquia
   - cadastra integrantes
   - gera convites

3. RESPONSAVEL
   - agora representa explicitamente o RESPONSÁVEL DO MINISTÉRIO
   - cria celebrações do próprio ministério
   - cadastra integrantes do próprio ministério
   - gera convites
   - administra repertório do ministério

4. COORDENADOR
   - permanece como função intermediária
   - pode editar/organizar músicas
   - não cadastra celebrações
   - não cadastra momentos
   - não administra integrantes/convites

5. MUSICO
   - participa do ministério
   - vê agenda, repertório e momentos
   - pode cadastrar novas músicas
   - pode confirmar escala

REGRAS IMPLEMENTADAS

1 - RESPONSÁVEL DO MINISTÉRIO
O papel de banco existente RESPONSAVEL é usado como
"Responsável do Ministério".

Não foi criado novo enum e não precisa migrar banco.

Um ADMIN_PAROQUIA, MASTER ou RESPONSAVEL atual pode,
na tela Integrantes, associar uma pessoa como:
- Músico
- Coordenador
- Responsável do Ministério

2 - CADASTRO DE MÚSICAS
Todos os integrantes ativos do ministério podem cadastrar músicas.

A edição/exclusão fica para:
- MASTER
- ADMIN_PAROQUIA
- RESPONSAVEL
- COORDENADOR

3 - CELEBRAÇÕES
Podem criar/editar/publicar celebrações:
- MASTER
- ADMIN_PAROQUIA
- RESPONSAVEL DO MINISTÉRIO

COORDENADOR e MUSICO não podem criar celebrações.

4 - MOMENTOS
Somente:
- MASTER
- ADMIN_PAROQUIA

podem cadastrar novos momentos.

Os demais podem consultar e utilizar os momentos já existentes.

5 - CONVITES
Podem gerar convite:
- MASTER
- ADMIN_PAROQUIA
- RESPONSAVEL DO MINISTÉRIO

6 - INTEGRANTES
Na tela Integrantes:
- MASTER
- ADMIN_PAROQUIA
- RESPONSAVEL DO MINISTÉRIO

podem selecionar uma pessoa já cadastrada na paróquia e
associá-la diretamente ao ministério.

Para uma pessoa que ainda não possui conta, use Convites.

ARQUIVOS SUBSTITUÍDOS AUTOMATICAMENTE AO EXTRAIR
- apps/api/src/plugins/group-guard.ts
- apps/api/src/routes/groups.ts
- apps/api/src/routes/musics.ts
- apps/api/src/routes/momentos.ts
- apps/web/src/components/GroupHeader.tsx
- apps/web/src/pages/Calendario.tsx
- apps/web/src/pages/MomentosLiturgicos.tsx
- apps/web/src/pages/Convites.tsx
- apps/web/src/pages/Integrantes.tsx

ARQUIVOS AJUSTADOS PELO SCRIPT
- apps/api/src/routes/missas.ts
- apps/web/src/pages/Musicas.tsx
- apps/web/src/pages/MissaEditor.tsx

COMO APLICAR

1. Extraia este ZIP por cima de:
D:\GitHub\cantus-dei

2. Na raiz execute:
python APLICAR-PERMISSOES-V4.py

3. Depois:
npm run build

4. Se passar:
git add .
git commit -m "Reorganiza permissoes por paroquia e ministerio"
git push origin main

BANCO
Não precisa executar SQL.
