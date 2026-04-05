/**
 * @file ActionNormalizer.ts
 * @description Standardized action normalizer for multi-harness environments.
 * Uses explicit adapter registration to ensure high reliability across different AI frameworks.
 */

import type { ActionEnvelope, ActionData } from '../types/action.js';

export type AdapterFunction = (raw: any) => ActionEnvelope;

export class ActionNormalizer {
  private static registry = new Map<string, AdapterFunction>();

  /**
   * Internal registration of core supported harnesses
   */
  static {
    // Adapter for Anthropic's Claude Code (PreToolUse protocol)
    this.register('claude-code', (raw) => ({
      actor: { skill: { id: 'claude-code', source: 'official', version_ref: '1.0.0', artifact_hash: '' } },
      action: { type: 'exec_command', data: raw.tool_input as ActionData },
      context: { session_id: raw.session_id || 'default', user_present: true, env: 'prod', time: new Date().toISOString() }
    }));

    // Adapter for OpenClaw (Plugin-based architecture)
    this.register('openclaw', (raw) => ({
      actor: { skill: { id: raw.skillId || 'openclaw-plugin', source: 'local', version_ref: '1.0.0', artifact_hash: '' } },
      action: { type: (raw.actionType || 'exec_command') as any, data: raw.params as ActionData },
      context: { session_id: 'openclaw-session', user_present: true, env: 'prod', time: new Date().toISOString() }
    }));

    // Adapter for Open Multi Agent (Parallel orchestration framework)
    this.register('open-multi-agent', (raw) => ({
      actor: { skill: { id: 'parallel-orchestrator', source: 'local', version_ref: '1.0.0', artifact_hash: '' } },
      action: { type: 'exec_command', data: { command: raw.prompt || '' } as ActionData },
      context: { session_id: 'parallel-session', user_present: true, env: 'prod', time: new Date().toISOString() }
    }));
  }

  /**
   * Registers a new harness adapter. 
   * This allows the community to extend Agent Guard support for any AI framework.
   */
  public static register(harnessId: string, adapter: AdapterFunction): void {
    this.registry.set(harnessId.toLowerCase(), adapter);
  }

  /**
   * Normalizes raw data based on an explicit harness identifier.
   * This prevents collision and ensures deterministic auditing.
   */
  public static normalize(raw: any, harnessId: string): ActionEnvelope {
    const adapter = this.registry.get(harnessId.toLowerCase());
    
    if (adapter) {
      try {
        return adapter(raw);
      } catch (err) {
        console.error(`[ActionNormalizer] Failed to normalize via ${harnessId} adapter: `, err);
      }
    }

    // Fallback to a safe, generic envelope for unknown or failing adapters
    return {
      actor: { skill: { id: `unsupported-${harnessId}`, source: 'unknown', version_ref: '0.0.0', artifact_hash: '' } },
      action: { type: 'exec_command', data: { command: typeof raw === 'string' ? raw : JSON.stringify(raw) } as any },
      context: { session_id: 'fallback', user_present: false, env: 'dev', time: new Date().toISOString() }
    };
  }
}
