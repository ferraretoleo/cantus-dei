CANTUS DEI V11.3

Correção da V11.2.

Foi verificado que a melhoria anterior NÃO estava presente no código atual do
MissaEditor.tsx. Por isso, ao abrir uma celebração PUBLICADA, o painel de
compartilhamento não aparecia.

A V11.3 adiciona de forma explícita:

- detecção de missa.status === PUBLICADA
- leitura de missa.tokenPublico
- montagem do link público
- Abrir publicação
- Copiar link
- Compartilhar
- WhatsApp
- Enviar por e-mail

O painel aparece automaticamente ao abrir uma celebração publicada.

Não precisa SQL.

Aplicação:

cd D:\GitHub\cantus-dei

python APLICAR-COMPARTILHAR-PUBLICACAO-V11-3.py

npm run build

Se passar:

git add .
git commit -m "Corrige compartilhamento de celebracao publicada"
git push origin main
