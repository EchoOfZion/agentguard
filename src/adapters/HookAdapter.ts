import { SecurityEngine } from '../core/SecurityEngine.js';
import { ActionNormalizer } from '../core/ActionNormalizer.js';

/**
 * HookAdapter - Bridges modern frameworks to the standardized security core.
 */
export const createGoPlusHook = (architecture: string = 'open multi agent') => {
  return async (ctx: { prompt: string; agent: { name: string } }) => {
    // 1. Normalize the raw context into a standard ActionEnvelope
    const envelope = ActionNormalizer.normalize(ctx, architecture);

    // 2. Audit the standardized action
    const result = await SecurityEngine.auditAction(envelope);
    
    if (!result.isSafe) {
      console.log(`[HookAdapter]  Action blocked: ${result.reason}`);
      ctx.prompt = result.modifiedPrompt;
    }

    return ctx;
  };
};
