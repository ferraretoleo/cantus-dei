CANTUS DEI - FIX V10.2
HORÁRIO DA CELEBRAÇÃO + STATUS DA ESCALA

1. HORÁRIO
Problema:
ao abrir uma celebração já cadastrada, o campo datetime-local usava:
new Date(...).toISOString().slice(0,16)

toISOString() converte a data para UTC.
Exemplo:
09:00 no Brasil pode virar 12:00 UTC.

Correção:
o editor agora monta o valor do datetime-local com:
- getFullYear()
- getMonth()
- getDate()
- getHours()
- getMinutes()

Assim, uma celebração cadastrada às 09:00 volta a aparecer às 09:00
quando for aberta para edição.

A gravação continua convertendo corretamente para ISO antes de enviar
à API.

2. ESCALA
Problema:
quando o administrador selecionava pessoas para servir, a tabela
missa_escala criava os registros com confirmação PENDENTE por padrão.
O Dashboard mostrava literalmente:
ESCALA: PENDENTE

Isso dava a impressão de que a escala não havia sido salva.

Correção visual:
- PENDENTE -> ESCALADO
- CONFIRMADO -> ESCALA: CONFIRMADO
- AUSENTE -> ESCALA: AUSENTE

Nenhum dado de escala é perdido ou alterado.
O mecanismo de confirmação existente continua preservado.

ARQUIVOS ALTERADOS
apps/web/src/pages/MissaEditor.tsx
apps/web/src/pages/Dashboard.tsx

NÃO PRECISA SQL.
NÃO ALTERA API.
NÃO ALTERA BANCO.

COMO APLICAR

cd D:\GitHub\cantus-dei
python APLICAR-FIX-HORARIO-ESCALA-V10-2.py
npm run build

Se passar:

git add .
git commit -m "Corrige horario da celebracao e status da escala"
git push origin main
