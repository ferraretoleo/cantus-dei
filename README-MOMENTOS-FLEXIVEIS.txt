CANTUS DEI - MOMENTOS LITÚRGICOS FLEXÍVEIS

O que foi implementado:

1. Criar novos momentos diretamente na tela da celebração
   Exemplos:
   - Ladainha
   - Salmo 1
   - Salmo 2
   - Salmo 3
   - Veneração da Cruz
   - Procissão
   - Renovação das promessas
   - Adoração

2. Repetir o mesmo momento quantas vezes quiser

   Exemplo:
   Comunhão
   - Música 1
   - Música 2
   - Música 3

3. Botão:
   + Outra música neste momento

   Esse botão cria imediatamente outro item usando o mesmo momento.

4. Sete Salmos em uma celebração

   Você pode criar:
   Salmo 1
   Salmo 2
   Salmo 3
   Salmo 4
   Salmo 5
   Salmo 6
   Salmo 7

   e escolher uma música/cifra diferente para cada um.

5. Ordenação manual

   Cada item do repertório possui:
   ↑ subir
   ↓ descer

6. Observação individual

   Cada música da celebração pode ter uma observação:
   - somente refrão
   - repetir 2x
   - instrumental
   - cantor solo
   etc.

IMPORTANTE

A estrutura do banco já permite várias músicas no mesmo momento.
Não foi necessário alterar banco nem executar SQL.

Os novos momentos ficam disponíveis para o grupo e podem ser usados
também em outras celebrações.

COMO APLICAR

1. Extraia por cima de:
D:\GitHub\cantus-dei

2. Execute:
npm run build

3. Se passar:
git add .
git commit -m "Permite momentos especiais e varias musicas por momento"
git push origin main

Não precisa alterar Neon.
Não precisa alterar Render manualmente.
