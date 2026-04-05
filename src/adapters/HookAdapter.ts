import { SecurityEngine } from '../core/engine.js';

/**
 * Adapter for modern in-process agent frameworks using lifecycle hooks.
 */
export const createGoPlusHook = () => {
  return async (ctx: { prompt: string; agent: { name: string } }) => {
    const result = await SecurityEngine.audit({
      prompt: ctx.prompt,
      agentId: ctx.agent.name
    });
    
    // In-place modification of the prompt before LLM call
    ctx.prompt = result.modifiedPrompt;
    return ctx;
  };
};
