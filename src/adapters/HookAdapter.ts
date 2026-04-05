import { SecurityEngine } from '../core/SecurityEngine.js';
import { ActionNormalizer } from '../core/ActionNormalizer.js';

/**
 * HookAdapter - Bridges AI frameworks to the GoPlus security core.
 * Requires a explicit harness identifier (e.g., 'claude-code', 'open-multi-agent').
 */
export const createGoPlusHook = (harnessId: string) => {
  if (!harnessId) {
    throw new Error('[HookAdapter] A valid harnessId is required to initialize the security hook.');
  }

  return async (ctx: { prompt: string; agent: { name: string }; rawPayload?: any }) => {
    // 1. Normalize the raw context or prompt into a standard ActionEnvelope
    // We prioritize rawPayload if available, otherwise fallback to the generic prompt ctx
    const dataToNormalize = ctx.rawPayload || ctx;
    const envelope = ActionNormalizer.normalize(dataToNormalize, harnessId);

    // 2. Audit the standardized action envelope
    const result = await SecurityEngine.auditAction(envelope);
    
    if (!result.isSafe) {
      console.log(`[HookAdapter] Action blocked for harness [${harnessId}]: ${result.reason}`);
      ctx.prompt = result.modifiedPrompt;
    }

    return ctx;
  };
};
