import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

function App() {
  return (
    <main className="min-h-screen grid place-items-center p-6 bg-violet-50 text-slate-900">
      <section className="w-full max-w-3xl rounded-3xl border border-violet-100 bg-white p-10 shadow-xl shadow-violet-950/5">
        <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-violet-700">Cantus Dei</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-6xl">Liturgia, repertório e músicos no mesmo lugar.</h1>
        <p className="mt-5 text-lg leading-8 text-slate-600">Base inicial criada. Calendário, repertório e modo palco entram após a aprovação desta fase.</p>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
