INSERT INTO momentos (id, nome, ordem_liturgica, slug, grupo_id, created_at, updated_at)
SELECT gen_random_uuid(), v.nome, v.ordem, v.slug, NULL, now(), now()
FROM (
  VALUES
    ('Entrada', 1, 'entrada'),
    ('Ato Penitencial (Perdão)', 2, 'ato-penitencial'),
    ('Glória', 3, 'gloria'),
    ('Salmo Responsorial', 4, 'salmo-responsorial'),
    ('Aclamação ao Evangelho', 5, 'aclamacao-evangelho'),
    ('Ofertório', 6, 'ofertorio'),
    ('Santo', 7, 'santo'),
    ('Cordeiro de Deus', 8, 'cordeiro-de-deus'),
    ('Comunhão', 9, 'comunhao'),
    ('Ação de Graças (Pós-comunhão)', 10, 'acao-de-gracas'),
    ('Ave Maria / Mariana', 11, 'mariana'),
    ('Final', 12, 'final')
) AS v(nome, ordem, slug)
WHERE NOT EXISTS (
  SELECT 1
  FROM momentos m
  WHERE m.slug = v.slug
    AND m.grupo_id IS NULL
);
