/** Command pattern: every site-knowledge tool is a small object with a Gemini declaration and a `run`.
 * Declarations are built from the live manifest so category enums follow the data, not a hard-coded list. */
import type { Manifest } from '../../../lib/types';
import type { PageContext } from '../../types';
import type { LedgerStore } from '../store';

export type Json = Record<string, unknown>;

export interface ToolContext {
  store: LedgerStore;
  siteUrl: string;
  page: PageContext | null;
}

export const categoryUrl = (ctx: ToolContext, categoryId: string, params = '') => `${ctx.siteUrl}/#/c/${categoryId}${params}`;
export const productUrl = (ctx: ToolContext, categoryId: string, productId: string) => `${ctx.siteUrl}/#/c/${categoryId}?open=${productId}`;

/** A tool-level problem the model should read back verbatim (unknown category, bad filter…). */
export class ToolError extends Error {}

export interface JsonSchema {
  type: string;
  description?: string;
  enum?: string[];
  items?: JsonSchema;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  nullable?: boolean;
  minItems?: number;
  maxItems?: number;
}

export interface Tool {
  name: string;
  description: string;
  parameters(manifest: Manifest): JsonSchema;
  run(args: Json, ctx: ToolContext): Promise<Json>;
}

export interface ToolDeclaration { name: string; description: string; parameters: JsonSchema }

export const declarationOf = (tool: Tool, manifest: Manifest): ToolDeclaration => ({ name: tool.name, description: tool.description, parameters: tool.parameters(manifest) });

export const categoryParam = (manifest: Manifest, description: string): JsonSchema => ({ type: 'string', description, enum: manifest.categories.map((c) => c.id) });

export function clamp(value: unknown, fallback: number, lo: number, hi: number): number {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.max(lo, Math.min(hi, Math.trunc(n)));
}

export const str = (value: unknown) => (typeof value === 'string' ? value.trim() : '');
export const strList = (value: unknown) => (Array.isArray(value) ? value.map(String) : []);
