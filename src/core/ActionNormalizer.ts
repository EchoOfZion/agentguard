/**
 * @file ActionNormalizer.ts
 * @description Whitelist-based action normalizer for validated AI harnesses.
 * Enforces strict mapping to ensure high-fidelity security auditing.
 */

import type { ActionEnvelope, ActionData } from '../types/action.js';

export type AdapterFunction = (raw: any) => ActionEnvelope;

export class ActionNormalizer {
  private static registry = new Map<string, AdapterFunction>();

  static {
    // 1. Anthropic Claude Code (Official Harness)
    this.register('claude-code', (raw) => ({
      actor: { skill: { id: 'claude-code', source: 'official', version_ref: '1.0.0', artifact_hash: '' } },
      action: { type: 'exec_command', data: raw.tool_input as ActionData },
      context: { session_id: raw.session_id || 'default', user_present: true, env: 'prod', time: new Date().toISOString() }
    }));

    // 2. OpenClaw (Open Source Agent Framework)
    this.register('openclaw', (raw) => ({
      actor: { skill: { id: raw.skillId || 'openclaw-plugin', source: 'local', version_ref: '1.0.0', artifact_hash: '' } },
      action: { type: (raw.actionType || 'exec_command') as any, data: raw.params as ActionData },
      context: { session_id: 'openclaw-session', user_present: true, env: 'prod', time: new Date().toISOString() }
    }));

    // 3. Open Multi Agent (Parallel Orchestration Harness)
    this.register('open-multi-agent', (raw) => ({
      actor: { skill: { id: 'parallel-orchestrator', source: 'local', version_ref: '1.0.0', artifact_hash: '' } },
      action: { type: 'exec_command', data: { command: raw.prompt || '' } as ActionData },
      context: { session_id: 'parallel-session', user_present: true, env: 'prod', time: new Date().toISOString() }
    }));
  }

  /**
   * Registers a validated harness adapter.
   */
  public static register(harnessId: string, adapter: AdapterFunction): void {
    this.registry.set(harnessId.toLowerCase(), adapter);
  }

  /**
   * Normalizes raw data ONLY for registered/whitelisted harnesses.
   * Unrecognized harnesses will return null to prevent unsafe partial auditing.
   */
  public static normalize(raw: any, harnessId: string): ActionEnvelope | null {
    const adapter = this.registry.get(harnessId.toLowerCase());
    
    if (!adapter) {
      console.warn(`[ActionNormalizer] Unsupported harness: ${harnessId}. Skipping normalization for safety.`);
      return null;
    }

    try {
      return adapter(raw);
    } catch (err) {
      console.error(`[ActionNormalizer] Failed to normalize validated harness [${harnessId}]:`, err);
      return null;
    }
  }

  /**
   * Returns a list of currently supported and validated harnesses.
   */
  public static getSupportedHarnesses(): string[] {
    return Array.from(this.registry.keys());
  }
}
