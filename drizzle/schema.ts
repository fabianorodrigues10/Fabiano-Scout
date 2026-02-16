import {
  boolean,
  date,
  decimal,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Tabela de atletas
export const atletas = mysqlTable("atletas", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  // Campos padrão
  nome: varchar("nome", { length: 255 }).notNull(),
  posicao: varchar("posicao", { length: 100 }),
  segundaPosicao: varchar("segundaPosicao", { length: 100 }),
  clube: varchar("clube", { length: 255 }),
  dataNascimento: date("dataNascimento"),
  idade: int("idade"),
  altura: decimal("altura", { precision: 5, scale: 2 }), // Ex: 180.50 cm
  pe: mysqlEnum("pe", ["direito", "esquerdo", "ambidestro"]),
  link: text("link"),
  escala: varchar("escala", { length: 100 }),
  valencia: varchar("valencia", { length: 100 }),
  
  // Campos customizados (JSON para flexibilidade)
  camposCustomizados: text("camposCustomizados"), // JSON string
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Tabela de configuração de campos customizados
export const configuracaoCampos = mysqlTable("configuracaoCampos", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  // Nome do campo customizado
  nomeCampo: varchar("nomeCampo", { length: 255 }).notNull(),
  
  // Tipo do campo (text, number, select, date)
  tipoCampo: mysqlEnum("tipoCampo", ["text", "number", "select", "date"]).notNull(),
  
  // Opções para campos do tipo select (JSON array)
  opcoes: text("opcoes"),
  
  // Se o campo está ativo
  ativo: boolean("ativo").default(true).notNull(),
  
  // Ordem de exibição
  ordem: int("ordem").notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Tabela de configuração de campos padrão (visibilidade)
export const configuracaoCamposPadrao = mysqlTable("configuracaoCamposPadrao", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  // Nome do campo padrão
  nomeCampo: varchar("nomeCampo", { length: 100 }).notNull(),
  
  // Se o campo está visível
  visivel: boolean("visivel").default(true).notNull(),
  
  // Ordem de exibição
  ordem: int("ordem").notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Tipos TypeScript adicionais
export type Atleta = typeof atletas.$inferSelect;
export type InsertAtleta = typeof atletas.$inferInsert;

export type ConfiguracaoCampo = typeof configuracaoCampos.$inferSelect;
export type InsertConfiguracaoCampo = typeof configuracaoCampos.$inferInsert;

export type ConfiguracaoCampoPadrao = typeof configuracaoCamposPadrao.$inferSelect;
export type InsertConfiguracaoCampoPadrao = typeof configuracaoCamposPadrao.$inferInsert;
