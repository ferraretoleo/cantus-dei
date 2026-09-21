import { and, eq, isNull } from 'drizzle-orm';
import { db } from './client.js';
import { momentos } from './schema.js';

const seed = [
  ['Entrada', 'entrada'],
  ['Ato Penitencial (Perdão)', 'ato-penitencial'],
  ['Glória', 'gloria'],
  ['Salmo Responsorial', 'salmo-responsorial'],
  ['Aclamação ao Evangelho', 'aclamacao-evangelho'],
  ['Ofertório', 'ofertorio'],
  ['Santo', 'santo'],
  ['Cordeiro de Deus', 'cordeiro-de-deus'],
  ['Comunhão', 'comunhao'],
  ['Ação de Graças (Pós-comunhão)', 'acao-de-gracas'],
  ['Ave Maria / Mariana', 'mariana'],
  ['Final', 'final']
] as const;

for (let i = 0; i < seed.length; i++) {
  const [nome, slug] = seed[i];

  const existente = await db
    .select({ id: momentos.id })
    .from(momentos)
    .where(
      and(
        eq(momentos.slug, slug),
        isNull(momentos.grupoId)
      )
    )
    .limit(1);

  if (!existente.length) {
    await db.insert(momentos).values({
      nome,
      slug,
      ordemLiturgica: i + 1,
      grupoId: null
    });
  }
}

console.log('Momentos litúrgicos globais carregados.');