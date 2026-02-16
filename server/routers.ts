import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
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
    // Listar todos os atletas do usuário
    list: protectedProcedure.query(({ ctx }) => {
      return db.getAtletas(ctx.user.id);
    }),

    // Buscar atleta por ID
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ ctx, input }) => {
        return db.getAtletaById(input.id, ctx.user.id);
      }),

    // Buscar atletas com filtros
    search: protectedProcedure
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
        return db.searchAtletas(ctx.user.id, input);
      }),

    // Criar novo atleta
    create: protectedProcedure
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
          valencia: z.string().max(100).optional(),
          camposCustomizados: z.string().optional(), // JSON string
        })
      )
      .mutation(async ({ ctx, input }) => {
        const id = await db.createAtleta({
          userId: ctx.user.id,
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
    update: protectedProcedure
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
          valencia: z.string().max(100).optional(),
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
        
        await db.updateAtleta(id, ctx.user.id, updateData);
        return { success: true };
      }),

    // Excluir atleta
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteAtleta(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // ==================== CONFIGURAÇÃO DE CAMPOS ====================
  campos: router({
    // Listar campos customizados
    listCustomizados: protectedProcedure.query(({ ctx }) => {
      return db.getCamposCustomizados(ctx.user.id);
    }),

    // Listar configuração de campos padrão
    listPadrao: protectedProcedure.query(({ ctx }) => {
      return db.getCamposPadrao(ctx.user.id);
    }),

    // Criar campo customizado
    createCustomizado: protectedProcedure
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
          userId: ctx.user.id,
          nomeCampo: input.nomeCampo,
          tipoCampo: input.tipoCampo,
          opcoes: input.opcoes || null,
          ativo: input.ativo,
          ordem: input.ordem,
        });
        return { id };
      }),

    // Atualizar campo customizado
    updateCustomizado: protectedProcedure
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
        await db.updateCampoCustomizado(id, ctx.user.id, data);
        return { success: true };
      }),

    // Excluir campo customizado
    deleteCustomizado: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteCampoCustomizado(input.id, ctx.user.id);
        return { success: true };
      }),

    // Atualizar configuração de campo padrão
    updatePadrao: protectedProcedure
      .input(
        z.object({
          nomeCampo: z.string().min(1).max(100),
          visivel: z.boolean(),
          ordem: z.number(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const id = await db.upsertCampoPadrao({
          userId: ctx.user.id,
          nomeCampo: input.nomeCampo,
          visivel: input.visivel,
          ordem: input.ordem,
        });
        return { id };
      }),
  }),
});

export type AppRouter = typeof appRouter;
