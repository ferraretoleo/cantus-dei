CANTUS DEI - FIX V10.1

Corrige os 3 erros TypeScript causados pelos resets de estado
que não incluíam o novo campo dataNascimento.

Arquivos corrigidos:
- apps/web/src/pages/MasterAdmin.tsx
- apps/web/src/pages/ParoquiaAdmin.tsx

Como aplicar:

cd D:\GitHub\cantus-dei
python APLICAR-FIX-ANIVERSARIOS-V10-1.py
npm run build

Se passar:
git add .
git commit -m "Corrige estados de aniversario"
git push origin main

Não precisa executar SQL novamente.
