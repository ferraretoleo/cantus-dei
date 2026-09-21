import { z } from 'zod';

export const papelGrupoSchema = z.enum(['RESPONSAVEL', 'COORDENADOR', 'MUSICO']);
export type PapelGrupo = z.infer<typeof papelGrupoSchema>;

export const registerSchema = z.object({
  nome: z.string().min(2).max(120),
  email: z.string().email().max(255),
  senha: z.string().min(8).max(128),
  telefone: z.string().max(30).optional()
});

export const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(1)
});

export const createGrupoSchema = z.object({
  nome: z.string().min(2).max(120),
  paroquia: z.string().min(2).max(160),
  cidade: z.string().min(2).max(120),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).min(3).max(80),
  corTema: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#7C3AED')
});

export const createConviteSchema = z.object({
  email: z.string().email().optional(),
  telefone: z.string().min(8).max(30).optional(),
  papelProposto: papelGrupoSchema.default('MUSICO')
}).refine(v => v.email || v.telefone, { message: 'Informe e-mail ou telefone.' });

export const acceptConviteSchema = z.object({ token: z.string().min(20) });
