from pathlib import Path

# LOGIN
login = Path("apps/web/src/pages/Login.tsx")
text = login.read_text(encoding="utf-8")

text = text.replace(
    "import { Link, useNavigate } from 'react-router-dom';",
    "import { useNavigate } from 'react-router-dom';"
)

old = r'''          <p className="mt-6 text-center text-sm cantus-muted">
            Ainda não participa?{' '}
            <Link className="font-bold cantus-gold" to="/registrar">
              Criar conta
            </Link>
          </p>
'''

if old not in text:
    raise SystemExit("Trecho 'Criar conta' não encontrado em Login.tsx.")

text = text.replace(old, "", 1)
login.write_text(text, encoding="utf-8")
print("OK: Login sem auto cadastro público.")

# APP
app = Path("apps/web/src/App.tsx")
text = app.read_text(encoding="utf-8")

text = text.replace(
    "import Registrar from './pages/Registrar';\n",
    ""
)

old_route = '          <Route path="/registrar" element={<Registrar />} />\n'
new_route = '''          <Route
            path="/registrar"
            element={<Navigate to="/login" replace />}
          />
'''

if old_route not in text:
    raise SystemExit("Rota /registrar não encontrada em App.tsx.")

text = text.replace(old_route, new_route, 1)
app.write_text(text, encoding="utf-8")
print("OK: /registrar bloqueado e redirecionado para /login.")
