/**
 * @file ActionNormalizer.ts
 * @description Validated harness registry for GoPlus Agent Guard.
 * Supports industry-standard protocols with high-fidelity mapping.
 */

import type { ActionEnvelope, ActionData } from '../types/action.js';

export type AdapterFunction = (raw: any) => ActionEnvelope;

export class ActionNormalizer {
  private static registry = new Map<string, AdapterFunction>();

  static {
    // 1. Anthropic Claude Code (Official Protocol)
    this.register('claude-code', (raw) => ({
      actor: { skill: { id: 'claude-code', source: 'official', version_ref: '1.0.0', artifact_hash: '' } },
      action: { type: 'exec_command', data: raw.tool_input as ActionData },
      context: { session_id: raw.session_id || 'default', user_present: true, env: 'prod', time: new Date().toISOString() }
    }));

    // 2. Model Context Protocol (MCP - Industry Standard)
    // MCP uses standardized call_tool requests
    this.register('mcp', (raw) => ({
      actor: { skill: { id: raw.name || 'mcp-server', source: 'mcp', version_ref: '1.0.0', artifact_hash: '' } },
      action: { type: 'exec_command', data: raw.arguments as ActionData },
      context: { session_id: 'mcp-session', user_present: true, env: 'prod', time: new Date().toISOString() }
    }));

    // 3. OpenAI Function Calling (The most common format)
    this.register('openai-functions', (raw) => ({
      actor: { skill: { id: 'openai-agent', source: 'official', version_ref: '4.0.0', artifact_hash: '' } },
      action: { type: 'exec_command', data: (typeof raw.arguments === 'string' ? JSON.parse(raw.arguments) : raw.arguments) as ActionData },
      context: { session_id: 'openai-session', user_present: true, env: 'prod', time: new Date().toISOString() }
    }));

    // 4. OpenClaw (Local Plugin Harness)
    this.register('openclaw', (raw) => ({
      actor: { skill: { id: raw.skillId || 'openclaw-plugin', source: 'local', version_ref: '1.0.0', artifact_hash: '' } },
      action: { type: (raw.actionType || 'exec_command') as any, data: raw.params as ActionData },
      context: { session_id: 'openclaw-session', user_present: true, env: 'prod', time: new Date().toISOString() }
    }));

    // 5. Open Multi Agent (Parallel Orchestration)
    this.register('open-multi-agent', (raw) => ({
      actor: { skill: { id: 'parallel-orchestrator', source: 'local', version_ref: '1.0.0', artifact_hash: '' } },
      action: { type: 'exec_command', data: { command: raw.prompt || '' } as ActionData },
      context: { session_id: 'parallel-session', user_present: true, env: 'prod', time: new Date().toISOString() }
    }));
  }

  public static register(harnessId: string, adapter: AdapterFunction): void {
    this.registry.set(harnessId.toLowerCase(), adapter);
  }

  public static normalize(raw: any, harnessId: string): ActionEnvelope | null {
    const adapter = this.registry.get(harnessId.toLowerCase());
    if (!adapter) return null;
    try {
      return adapter(raw);
    } catch (err) {
      return null;
    }
  }
}
