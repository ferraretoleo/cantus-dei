# Cantus Dei V12 - Quebras por estrofe/refrão no Modo Palco

Esta alteração adiciona o marcador `[[QUEBRA]]` nos campos Letra e Cifra.

Cada trecho entre marcadores passa a ser uma tela independente no Modo Palco. O marcador não é exibido. O tamanho da fonte é recalculado automaticamente para manter o trecho visível. Músicas antigas sem marcador continuam com a paginação automática atual.

Não existe alteração de banco e não há SQL.

Exemplo:

```text
Primeira estrofe...
segunda linha...
[[QUEBRA]]
Refrão...
segunda linha do refrão...
[[QUEBRA]]
Segunda estrofe...
```

Aplicação:

```powershell
cd D:\GitHub\cantus-dei
python APLICAR-MODO-PALCO-QUEBRAS-V12.py
npm run build
```

Se o build passar:

```powershell
git add apps/web/src/pages/Musicas.tsx apps/web/src/pages/ModoPalco.tsx
git commit -m "Adiciona quebras de estrofe no modo palco"
git push origin main
```
