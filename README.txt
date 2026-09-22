CANTUS DEI - CONTATOS DOS INTEGRANTES V7.2

ALTERAÇÃO

Na tela Integrantes, cada card passa a mostrar claramente:

- Nome
- Papel no ministério
- E-mail
- Telefone
- Instrumento
- Voz

O e-mail fica clicável usando mailto:
O telefone fica clicável usando tel:

Caso o telefone não esteja cadastrado, aparece:
"Telefone não informado"

A API já retornava telefone e e-mail, portanto:
- não precisa alterar backend
- não precisa executar SQL
- não precisa alterar Neon

APLICAÇÃO

1. Extraia este ZIP na raiz:
D:\GitHub\cantus-dei

2. Execute:
python APLICAR-INTEGRANTES-CONTATO-V7-2.py

3. Depois:
npm run build

4. Se passar:
git add .
git commit -m "Mostra contatos dos integrantes"
git push origin main
