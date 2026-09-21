const salmos = [
  {
    referencia: 'Salmo 95(96),1',
    texto: 'Cantai ao Senhor um cântico novo.',
    tema: 'Louvor'
  },
  {
    referencia: 'Salmo 150,3-5',
    texto: 'Louvai-o ao som da trombeta, da harpa e da cítara.',
    tema: 'Música'
  },
  {
    referencia: 'Salmo 32(33),3',
    texto: 'Cantai para ele um cântico novo; tocai com arte e alegria.',
    tema: 'Ministério'
  },
  {
    referencia: 'Salmo 97(98),4',
    texto: 'Aclamai o Senhor, terra inteira; exultai e cantai.',
    tema: 'Celebração'
  },
  {
    referencia: 'Salmo 56(57),8',
    texto: 'Meu coração está firme; quero cantar e salmodiar.',
    tema: 'Entrega'
  },
  {
    referencia: 'Salmo 103(104),33',
    texto: 'Cantarei ao Senhor enquanto eu viver.',
    tema: 'Vocação'
  },
  {
    referencia: 'Salmo 146(147),1',
    texto: 'Como é bom cantar ao nosso Deus.',
    tema: 'Comunhão'
  }
];

export function salmoDoDia() {
  const inicio = new Date(new Date().getFullYear(), 0, 0);
  const hoje = new Date();
  const dia = Math.floor(
    (hoje.getTime() - inicio.getTime()) / 86400000
  );

  return salmos[dia % salmos.length];
}

export default function PsalmHighlight({
  compact = false
}: {
  compact?: boolean;
}) {
  const salmo = salmoDoDia();

  return (
    <section
      className={`cantus-card relative overflow-hidden ${
        compact ? 'p-5' : 'p-6 sm:p-8'
      }`}
    >
      <div className="absolute -right-8 -top-10 text-[9rem] leading-none text-white/[.025] select-none">
        ♪
      </div>

      <div className="cantus-eyebrow">
        Salmo em destaque · {salmo.tema}
      </div>

      <blockquote
        className={`cantus-display cantus-quote mt-5 ${
          compact
            ? 'text-2xl'
            : 'text-3xl sm:text-4xl'
        } leading-tight`}
      >
        “{salmo.texto}”
      </blockquote>

      <div className="mt-4 text-sm font-semibold cantus-gold">
        {salmo.referencia}
      </div>
    </section>
  );
}
