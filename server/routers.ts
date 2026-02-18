import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import * as db from "./db";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ==================== ATLETAS ====================
  atletas: router({
    // Listar todos os atletas do usuário (TEMPORÁRIO: public para testes)
    list: publicProcedure.query(({ ctx }) => {
      // Usar userId fixo 1 para testes sem autenticação
      const userId = ctx.user?.id || 1;
      return db.getAtletas(userId);
    }),

    // Buscar atleta por ID
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ ctx, input }) => {
        const userId = ctx.user?.id || 1;
        return db.getAtletaById(input.id, userId);
      }),

    // Buscar atletas com filtros
    search: publicProcedure
      .input(
        z.object({
          nome: z.string().optional(),
          posicao: z.string().optional(),
          clube: z.string().optional(),
          idadeMin: z.number().optional(),
          idadeMax: z.number().optional(),
          alturaMin: z.number().optional(),
          alturaMax: z.number().optional(),
          pe: z.string().optional(),
          escala: z.string().optional(),
          valencia: z.string().optional(),
        })
      )
      .query(({ ctx, input }) => {
        return db.searchAtletas(ctx.user?.id || 1, input);
      }),

    // Criar novo atleta
    create: publicProcedure
      .input(
        z.object({
          nome: z.string().min(1).max(255),
          posicao: z.string().max(100).optional(),
          segundaPosicao: z.string().max(100).optional(),
          clube: z.string().max(255).optional(),
          dataNascimento: z.string().optional(), // ISO date string
          idade: z.number().optional(),
          altura: z.number().optional(),
          pe: z.enum(["direito", "esquerdo", "ambidestro"]).optional(),
          link: z.string().optional(),
          escala: z.string().max(100).optional(),
          valencia: z.string().max(1000).optional(),
          camposCustomizados: z.string().optional(), // JSON string
        })
      )
      .mutation(async ({ ctx, input }) => {
        const id = await db.createAtleta({
          userId: ctx.user?.id || 1,
          nome: input.nome,
          posicao: input.posicao || null,
          segundaPosicao: input.segundaPosicao || null,
          clube: input.clube || null,
          dataNascimento: input.dataNascimento ? new Date(input.dataNascimento) : null,
          idade: input.idade || null,
          altura: input.altura?.toString() || null,
          pe: input.pe || null,
          link: input.link || null,
          escala: input.escala || null,
          valencia: input.valencia || null,
          camposCustomizados: input.camposCustomizados || null,
        });
        return { id };
      }),

    // Atualizar atleta
    update: publicProcedure
      .input(
        z.object({
          id: z.number(),
          nome: z.string().min(1).max(255).optional(),
          posicao: z.string().max(100).optional(),
          segundaPosicao: z.string().max(100).optional(),
          clube: z.string().max(255).optional(),
          dataNascimento: z.string().optional(),
          idade: z.number().optional(),
          altura: z.number().optional(),
          pe: z.enum(["direito", "esquerdo", "ambidestro"]).optional(),
          link: z.string().optional(),
          escala: z.string().max(100).optional(),
          valencia: z.string().max(1000).optional(),
          camposCustomizados: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        
        // Converte altura para string se fornecida
        const updateData: any = { ...data };
        if (data.altura !== undefined) {
          updateData.altura = data.altura.toString();
        }
        
        await db.updateAtleta(id, ctx.user?.id || 1, updateData);
        return { success: true };
      }),

    // Excluir atleta
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteAtleta(input.id, ctx.user?.id || 1);
        return { success: true };
      }),
  }),

  // ==================== AVALIAÇÕES ====================
  avaliacoes: router({
    // Buscar avaliação de um atleta
    get: publicProcedure
      .input(z.object({ atletaId: z.number() }))
      .query(({ ctx, input }) => {
        const userId = ctx.user?.id || 1;
        return db.getAvaliacao(input.atletaId, userId);
      }),

    // Criar ou atualizar avaliação
    upsert: publicProcedure
      .input(
        z.object({
          atletaId: z.number(),
          nota: z.number().min(1).max(10),
          comentarios: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user?.id || 1;
        const id = await db.upsertAvaliacao({
          userId,
          atletaId: input.atletaId,
          nota: input.nota,
          comentarios: input.comentarios || null,
        });
        return { id };
      }),

    // Deletar avaliação
    delete: publicProcedure
      .input(z.object({ atletaId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user?.id || 1;
        await db.deleteAvaliacao(input.atletaId, userId);
        return { success: true };
      }),
  }),

  // ==================== GRUPOS ====================
  grupos: router({
    // Listar todos os grupos
    list: publicProcedure.query(({ ctx }) => {
      const userId = ctx.user?.id || 1;
      return db.getGrupos(userId);
    }),

    // Buscar grupo por ID
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ ctx, input }) => {
        const userId = ctx.user?.id || 1;
        return db.getGrupoById(input.id, userId);
      }),

    // Buscar atletas de um grupo
    getAtletas: publicProcedure
      .input(z.object({ grupoId: z.number() }))
      .query(({ input }) => {
        return db.getAtletasDoGrupo(input.grupoId);
      }),

    // Criar novo grupo
    create: publicProcedure
      .input(
        z.object({
          nome: z.string().min(1).max(255),
          descricao: z.string().optional(),
          cor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user?.id || 1;
        const id = await db.createGrupo({
          userId,
          nome: input.nome,
          descricao: input.descricao || null,
          cor: input.cor || "#FF6B35",
        });
        return { id };
      }),

    // Atualizar grupo
    update: publicProcedure
      .input(
        z.object({
          id: z.number(),
          nome: z.string().min(1).max(255).optional(),
          descricao: z.string().optional(),
          cor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user?.id || 1;
        const { id, ...data } = input;
        await db.updateGrupo(id, userId, data);
        return { success: true };
      }),

    // Deletar grupo
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user?.id || 1;
        await db.removeAllAtletasDoGrupo(input.id);
        await db.deleteGrupo(input.id, userId);
        return { success: true };
      }),

    // Adicionar atleta ao grupo
    addAtleta: publicProcedure
      .input(z.object({ atletaId: z.number(), grupoId: z.number() }))
      .mutation(async ({ input }) => {
        const id = await db.addAtletaAoGrupo({
          atletaId: input.atletaId,
          grupoId: input.grupoId,
        });
        return { id };
      }),

    // Remover atleta do grupo
    removeAtleta: publicProcedure
      .input(z.object({ atletaId: z.number(), grupoId: z.number() }))
      .mutation(async ({ input }) => {
        await db.removeAtletaDoGrupo(input.atletaId, input.grupoId);
        return { success: true };
      }),
  }),

  // ==================== CONFIGURAÇÃO DE CAMPOS ====================
  campos: router({
    // Listar campos customizados
    listCustomizados: publicProcedure.query(({ ctx }) => {
      return db.getCamposCustomizados(ctx.user?.id || 1);
    }),

    // Listar configuração de campos padrão
    listPadrao: publicProcedure.query(({ ctx }) => {
      return db.getCamposPadrao(ctx.user?.id || 1);
    }),

    // Criar campo customizado
    createCustomizado: publicProcedure
      .input(
        z.object({
          nomeCampo: z.string().min(1).max(255),
          tipoCampo: z.enum(["text", "number", "select", "date"]),
          opcoes: z.string().optional(), // JSON array para selects
          ativo: z.boolean().default(true),
          ordem: z.number(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const id = await db.createCampoCustomizado({
          userId: ctx.user?.id || 1,
          nomeCampo: input.nomeCampo,
          tipoCampo: input.tipoCampo,
          opcoes: input.opcoes || null,
          ativo: input.ativo,
          ordem: input.ordem,
        });
        return { id };
      }),

    // Atualizar campo customizado
    updateCustomizado: publicProcedure
      .input(
        z.object({
          id: z.number(),
          nomeCampo: z.string().min(1).max(255).optional(),
          tipoCampo: z.enum(["text", "number", "select", "date"]).optional(),
          opcoes: z.string().optional(),
          ativo: z.boolean().optional(),
          ordem: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await db.updateCampoCustomizado(id, ctx.user?.id || 1, data);
        return { success: true };
      }),

    // Excluir campo customizado
    deleteCustomizado: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteCampoCustomizado(input.id, ctx.user?.id || 1);
        return { success: true };
      }),

    // Atualizar configuração de campo padrão
    updatePadrao: publicProcedure
      .input(
        z.object({
          nomeCampo: z.string().min(1).max(100),
          visivel: z.boolean(),
          ordem: z.number(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const id = await db.upsertCampoPadrao({
          userId: ctx.user?.id || 1,
          nomeCampo: input.nomeCampo,
          visivel: input.visivel,
          ordem: input.ordem,
        });
        return { id };
      }),
  }),
});

export type AppRouter = typeof appRouter;
