import { SecurityEngine } from '../core/SecurityEngine.js';
import { ActionNormalizer } from '../core/ActionNormalizer.js';

/**
 * HookAdapter - Enforces security auditing for whitelisted harnesses.
 */
export const createGoPlusHook = (harnessId: string) => {
  return async (ctx: { prompt: string; agent: { name: string }; rawPayload?: any }) => {
    const dataToNormalize = ctx.rawPayload || ctx;
    
    // Attempt normalization via whitelist
    const envelope = ActionNormalizer.normalize(dataToNormalize, harnessId);

    // If harness is not whitelisted, we cannot guarantee audit quality.
    // We log a warning but allow the prompt to pass through (or you can choose to block).
    if (!envelope) {
      console.warn(`[HookAdapter] Skipping security audit: Harness [${harnessId}] is not in the whitelist.`);
      return ctx;
    }

    // Perform audit on validated envelope
    const result = await SecurityEngine.auditAction(envelope);
    
    if (!result.isSafe) {
      console.log(`[HookAdapter] Action blocked for validated harness [${harnessId}]: ${result.reason}`);
      ctx.prompt = result.modifiedPrompt;
    }

    return ctx;
  };
};
