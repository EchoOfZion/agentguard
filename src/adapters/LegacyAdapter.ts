import { SecurityEngine } from '../core/engine.js';

/**
 * Adapter for legacy process-based orchestration (e.g. sessions_spawn).
 */
export class LegacyAdapter {
  public static async interceptCommand(cmd: string): Promise<string> {
    const result = await SecurityEngine.audit({
      prompt: cmd,
      metadata: { source: 'shell_interceptor' }
    });
    return result.modifiedPrompt;
  }
}
