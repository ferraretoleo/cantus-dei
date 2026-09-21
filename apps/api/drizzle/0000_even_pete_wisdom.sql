CREATE TYPE "public"."confirmacao_status" AS ENUM('PENDENTE', 'CONFIRMADO', 'AUSENTE');--> statement-breakpoint
CREATE TYPE "public"."convite_status" AS ENUM('PENDENTE', 'ACEITO', 'EXPIRADO', 'CANCELADO');--> statement-breakpoint
CREATE TYPE "public"."missa_status" AS ENUM('RASCUNHO', 'PUBLICADA', 'ARQUIVADA');--> statement-breakpoint
CREATE TYPE "public"."papel_grupo" AS ENUM('RESPONSAVEL', 'COORDENADOR', 'MUSICO');--> statement-breakpoint
CREATE TYPE "public"."partitura_tipo" AS ENUM('PDF', 'IMAGEM', 'MIDI', 'MUSICXML');--> statement-breakpoint
CREATE TABLE "convites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"grupo_id" uuid NOT NULL,
	"email" varchar(255),
	"telefone" varchar(30),
	"papel_proposto" "papel_grupo" NOT NULL,
	"token" varchar(100) NOT NULL,
	"expira_em" timestamp with time zone NOT NULL,
	"status" "convite_status" DEFAULT 'PENDENTE' NOT NULL,
	"convidado_por" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "convites_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "grupo_membros" (
	"grupo_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"papel" "papel_grupo" NOT NULL,
	"instrumento" varchar(80),
	"voz" varchar(30),
	"ativo" boolean DEFAULT true NOT NULL,
	"entrou_em" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "grupo_membros_grupo_id_user_id_pk" PRIMARY KEY("grupo_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "grupos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" varchar(120) NOT NULL,
	"paroquia" varchar(160) NOT NULL,
	"cidade" varchar(120) NOT NULL,
	"slug" varchar(80) NOT NULL,
	"cor_tema" varchar(7) DEFAULT '#7C3AED' NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "grupos_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "missa_escala" (
	"missa_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"instrumento_voz" varchar(100),
	"confirmacao" "confirmacao_status" DEFAULT 'PENDENTE' NOT NULL,
	"respondido_em" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "missa_escala_missa_id_user_id_pk" PRIMARY KEY("missa_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "missa_musicas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"missa_id" uuid NOT NULL,
	"musica_id" uuid NOT NULL,
	"momento_id" uuid NOT NULL,
	"ordem" integer NOT NULL,
	"tom_da_execucao" varchar(20),
	"partitura_id" uuid,
	"observacao" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "missa_momento_ordem_unq" UNIQUE("missa_id","momento_id","ordem")
);
--> statement-breakpoint
CREATE TABLE "missas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"grupo_id" uuid NOT NULL,
	"data_hora" timestamp with time zone NOT NULL,
	"local" varchar(180) NOT NULL,
	"tipo_celebracao" varchar(80) NOT NULL,
	"tempo_liturgico" varchar(40),
	"observacoes" text,
	"status" "missa_status" DEFAULT 'RASCUNHO' NOT NULL,
	"token_publico" varchar(64),
	"publicado_em" timestamp with time zone,
	"criado_por" uuid NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "missas_token_publico_unique" UNIQUE("token_publico")
);
--> statement-breakpoint
CREATE TABLE "momentos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" varchar(120) NOT NULL,
	"ordem_liturgica" integer NOT NULL,
	"slug" varchar(120) NOT NULL,
	"grupo_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "momentos_grupo_slug_unq" UNIQUE("grupo_id","slug")
);
--> statement-breakpoint
CREATE TABLE "musica_momentos" (
	"musica_id" uuid NOT NULL,
	"momento_id" uuid NOT NULL,
	CONSTRAINT "musica_momentos_musica_id_momento_id_pk" PRIMARY KEY("musica_id","momento_id")
);
--> statement-breakpoint
CREATE TABLE "musicas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"grupo_id" uuid NOT NULL,
	"titulo" varchar(220) NOT NULL,
	"autor_compositor" varchar(220),
	"tom_original" varchar(20),
	"andamento_bpm" integer,
	"tempo_compasso" varchar(20),
	"letra" text,
	"cifra" text,
	"video_url" text,
	"tags" text[] DEFAULT '{}',
	"observacoes" text,
	"compartilhada" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partituras" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"musica_id" uuid NOT NULL,
	"tipo" "partitura_tipo" NOT NULL,
	"instrumento" varchar(80) DEFAULT 'Geral' NOT NULL,
	"tom" varchar(20),
	"versao" varchar(80),
	"arquivo_key" text NOT NULL,
	"tamanho" integer,
	"mime" varchar(120),
	"enviado_por" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" varchar(120) NOT NULL,
	"email" varchar(255) NOT NULL,
	"senha_hash" text,
	"telefone" varchar(30),
	"avatar_url" text,
	"ativo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "convites" ADD CONSTRAINT "convites_grupo_id_grupos_id_fk" FOREIGN KEY ("grupo_id") REFERENCES "public"."grupos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "convites" ADD CONSTRAINT "convites_convidado_por_users_id_fk" FOREIGN KEY ("convidado_por") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grupo_membros" ADD CONSTRAINT "grupo_membros_grupo_id_grupos_id_fk" FOREIGN KEY ("grupo_id") REFERENCES "public"."grupos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grupo_membros" ADD CONSTRAINT "grupo_membros_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "missa_escala" ADD CONSTRAINT "missa_escala_missa_id_missas_id_fk" FOREIGN KEY ("missa_id") REFERENCES "public"."missas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "missa_escala" ADD CONSTRAINT "missa_escala_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "missa_musicas" ADD CONSTRAINT "missa_musicas_missa_id_missas_id_fk" FOREIGN KEY ("missa_id") REFERENCES "public"."missas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "missa_musicas" ADD CONSTRAINT "missa_musicas_musica_id_musicas_id_fk" FOREIGN KEY ("musica_id") REFERENCES "public"."musicas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "missa_musicas" ADD CONSTRAINT "missa_musicas_momento_id_momentos_id_fk" FOREIGN KEY ("momento_id") REFERENCES "public"."momentos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "missa_musicas" ADD CONSTRAINT "missa_musicas_partitura_id_partituras_id_fk" FOREIGN KEY ("partitura_id") REFERENCES "public"."partituras"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "missas" ADD CONSTRAINT "missas_grupo_id_grupos_id_fk" FOREIGN KEY ("grupo_id") REFERENCES "public"."grupos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "missas" ADD CONSTRAINT "missas_criado_por_users_id_fk" FOREIGN KEY ("criado_por") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "momentos" ADD CONSTRAINT "momentos_grupo_id_grupos_id_fk" FOREIGN KEY ("grupo_id") REFERENCES "public"."grupos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "musica_momentos" ADD CONSTRAINT "musica_momentos_musica_id_musicas_id_fk" FOREIGN KEY ("musica_id") REFERENCES "public"."musicas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "musica_momentos" ADD CONSTRAINT "musica_momentos_momento_id_momentos_id_fk" FOREIGN KEY ("momento_id") REFERENCES "public"."momentos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "musicas" ADD CONSTRAINT "musicas_grupo_id_grupos_id_fk" FOREIGN KEY ("grupo_id") REFERENCES "public"."grupos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partituras" ADD CONSTRAINT "partituras_musica_id_musicas_id_fk" FOREIGN KEY ("musica_id") REFERENCES "public"."musicas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partituras" ADD CONSTRAINT "partituras_enviado_por_users_id_fk" FOREIGN KEY ("enviado_por") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "convites_grupo_status_idx" ON "convites" USING btree ("grupo_id","status");--> statement-breakpoint
CREATE INDEX "grupo_membros_user_ativo_idx" ON "grupo_membros" USING btree ("user_id","ativo");--> statement-breakpoint
CREATE INDEX "missas_grupo_data_idx" ON "missas" USING btree ("grupo_id","data_hora");--> statement-breakpoint
CREATE INDEX "musicas_grupo_titulo_idx" ON "musicas" USING btree ("grupo_id","titulo");