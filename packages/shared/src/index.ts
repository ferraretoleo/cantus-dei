import { z } from 'zod';

export const papelGrupoSchema = z.enum(['RESPONSAVEL', 'COORDENADOR', 'MUSICO']);

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
}).refine(v => v.email || v.telefone, {
  message: 'Informe e-mail ou telefone.'
});

export const musicaSchema = z.object({
  titulo: z.string().min(2).max(220),
  autorCompositor: z.string().max(220).optional().nullable(),
  tomOriginal: z.string().max(20).optional().nullable(),
  andamentoBpm: z.number().int().min(1).max(400).optional().nullable(),
  tempoCompasso: z.string().max(20).optional().nullable(),
  letra: z.string().optional().nullable(),
  cifra: z.string().optional().nullable(),
  notacaoAbc: z.string().optional().nullable(),
  videoUrl: z.string().url().optional().nullable().or(z.literal('')),
  tags: z.array(z.string().min(1).max(60)).max(30).default([]),
  observacoes: z.string().optional().nullable(),
  compartilhada: z.boolean().default(false)
});

export const momentoSchema = z.object({
  nome: z.string().min(2).max(120),
  ordemLiturgica: z.number().int().min(1).max(999).optional()
});

export const missaSchema = z.object({
  dataHora: z.string().min(10),
  local: z.string().min(2).max(180),
  tipoCelebracao: z.string().min(2).max(80),
  tempoLiturgico: z.string().max(40).optional().nullable(),
  observacoes: z.string().optional().nullable()
});

export const repertorioSchema = z.object({
  itens: z.array(z.object({
    momentoId: z.string().uuid(),
    musicaId: z.string().uuid(),
    tomDaExecucao: z.string().max(20).optional().nullable(),
    observacao: z.string().optional().nullable()
  })).max(50)
});

export const escalaSchema = z.object({
  itens: z.array(z.object({
    userId: z.string().uuid(),
    instrumentoVoz: z.string().max(100).optional().nullable()
  })).max(100)
});

export const confirmacaoSchema = z.object({
  confirmacao: z.enum(['CONFIRMADO', 'AUSENTE'])
});
