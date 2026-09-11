/** Registry of site tools. Declarations are rebuilt per dataset version so enums track the live manifest. */
import type { Manifest } from '../../../lib/types';
import { declarationOf, ToolError, type Json, type Tool, type ToolContext, type ToolDeclaration } from './base';
import { getReferenceCeiling, getRoutines, getScoringMethod, getSiteOverview, listCategories } from './catalog';
import { getIngredientKnowledge } from './knowledge';
import { compareProducts, getCategoryFilters, getProduct, getTopProducts, searchProducts } from './products';
import { proposeRoutineSteps } from './routine';

export const ALL_TOOLS: Tool[] = [
  getSiteOverview, listCategories, getScoringMethod, getReferenceCeiling, getRoutines,
  searchProducts, getTopProducts, getCategoryFilters, getProduct, compareProducts, getIngredientKnowledge, proposeRoutineSteps,
];

export class ToolRegistry {
  private readonly tools: Map<string, Tool>;
  private declaredFor: string | null = null;
  private declared: ToolDeclaration[] = [];

  constructor(tools: Tool[] = ALL_TOOLS) { this.tools = new Map(tools.map((t) => [t.name, t])); }

  names() { return [...this.tools.keys()]; }

  surfaces(name: string) { return this.tools.get(name)?.surface === true; }

  declarations(manifest: Manifest): ToolDeclaration[] {
    if (manifest.generatedAt !== this.declaredFor) {
      this.declared = [...this.tools.values()].map((t) => declarationOf(t, manifest));
      this.declaredFor = manifest.generatedAt;
    }
    return this.declared;
  }

  /** Run a tool; tool-level problems come back as an `error` payload the model can read, never as a crash. */
  async execute(name: string, args: Json, ctx: ToolContext): Promise<{ result: Json; ms: number }> {
    const started = performance.now();
    const tool = this.tools.get(name);
    if (!tool) return { result: { error: `Unknown tool ${name}` }, ms: 0 };
    let result: Json;
    try {
      result = await tool.run(args, ctx);
    } catch (err) {
      if (!(err instanceof ToolError)) throw err;
      result = { error: err.message };
    }
    return { result, ms: performance.now() - started };
  }
}

export const sizeOf = (payload: Json) => JSON.stringify(payload).length;
