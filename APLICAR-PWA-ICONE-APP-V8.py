from pathlib import Path

index = Path("apps/web/index.html")
html = index.read_text(encoding="utf-8")

old_theme = '<meta name="theme-color" content="#6d28d9" />'
new_head = '''<meta name="theme-color" content="#0c0d0f" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="Cantus Dei" />
    <link rel="manifest" href="/manifest.webmanifest?v=8" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32-v8.png" />
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon-v8.png" />'''

if old_theme not in html:
    raise SystemExit("Meta theme-color atual não encontrada em apps/web/index.html.")

html = html.replace(old_theme, new_head, 1)

old_script = '    <script type="module" src="/src/main.tsx"></script>'
new_script = '''    <script type="module" src="/src/main.tsx"></script>
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker
            .register('/sw.js?v=8')
            .then(registration => registration.update())
            .catch(() => {});
        });
      }
    </script>'''

if old_script not in html:
    raise SystemExit("Script main.tsx não encontrado em apps/web/index.html.")

html = html.replace(old_script, new_script, 1)
index.write_text(html, encoding="utf-8")

print("PWA e ícones configurados na aplicação Cantus Dei.")
