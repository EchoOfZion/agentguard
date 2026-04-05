/**
 * @file ActionNormalizer.ts
 * @description Adaptive normalizer for multi-harness environments.
 * Supports dynamic registration of custom harness adapters.
 */

import type { ActionEnvelope, ActionData } from '../types/action.js';

export type AdapterFunction = (raw: any) => ActionEnvelope;

export class ActionNormalizer {
  private static registry = new Map<string, AdapterFunction>();

  /**
   * Automatically register built-in adapters
   */
  static {
    this.register('claude-code', (raw) => ({
      actor: { skill: { id: 'claude-code', source: 'official', version_ref: '1.0.0', artifact_hash: '' } },
      action: { type: 'exec_command', data: raw.tool_input as ActionData },
      context: { session_id: raw.session_id || 'default', user_present: true, env: 'prod', time: new Date().toISOString() }
    }));

    this.register('openclaw', (raw) => ({
      actor: { skill: { id: raw.skillId || 'openclaw-plugin', source: 'local', version_ref: '1.0.0', artifact_hash: '' } },
      action: { type: (raw.actionType || 'exec_command') as any, data: raw.params as ActionData },
      context: { session_id: 'openclaw-session', user_present: true, env: 'prod', time: new Date().toISOString() }
    }));

    this.register('open-multi-agent', (raw) => ({
      actor: { skill: { id: 'parallel-orchestrator', source: 'local', version_ref: '1.0.0', artifact_hash: '' } },
      action: { type: 'exec_command', data: { command: raw.prompt || '' } as ActionData },
      context: { session_id: 'parallel-session', user_present: true, env: 'prod', time: new Date().toISOString() }
    }));
  }

  /**
   * Registers a new harness adapter dynamically
   */
  public static register(harnessName: string, adapter: AdapterFunction): void {
    this.registry.set(harnessName.toLowerCase(), adapter);
  }

  /**
   * Normalizes raw data into a standard ActionEnvelope using registered adapters or heuristics
   */
  public static normalize(raw: any, harnessHint?: string): ActionEnvelope {
    // 1. Try registered adapter by hint
    if (harnessHint) {
      const adapter = this.registry.get(harnessHint.toLowerCase());
      if (adapter) return adapter(raw);
    }

    // 2. Heuristic detection based on object structure
    if (raw.tool_name && raw.tool_input) return this.registry.get('claude-code')!(raw);
    if (raw.actionName || raw.toolName) return this.registry.get('openclaw')!(raw);
    if (raw.prompt && raw.agent) return this.registry.get('open-multi-agent')!(raw);

    // 3. Fallback to generic envelope
    return {
      actor: { skill: { id: 'unknown', source: 'unknown', version_ref: '0.0.0', artifact_hash: '' } },
      action: { type: 'exec_command', data: { command: typeof raw === 'string' ? raw : JSON.stringify(raw) } as any },
      context: { session_id: 'gen', user_present: false, env: 'dev', time: new Date().toISOString() }
    };
  }
}
