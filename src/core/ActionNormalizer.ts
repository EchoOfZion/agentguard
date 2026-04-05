/**
 * @file ActionNormalizer.ts
 * @description Normalizes raw action data from various platforms into a standard ActionEnvelope.
 */

import type { ActionEnvelope, ActionType, ActionData } from '../types/action.js';

export class ActionNormalizer {
  /**
   * Normalizes input from different architectures.
   * @param raw - The raw input object from the specific platform.
   * @param architecture - The source architecture (e.g., 'claude-code', 'openclaw', 'parallel-01').
   */
  public static normalize(raw: any, architecture: string): ActionEnvelope {
    switch (architecture) {
      case 'claude-code':
        return this.fromClaudeCode(raw);
      case 'openclaw':
        return this.fromOpenClaw(raw);
      case 'parallel-01':
      case '架构01':
        return this.fromParallelOrchestrator(raw);
      default:
        return this.genericEnvelope(raw);
    }
  }

  private static fromClaudeCode(raw: any): ActionEnvelope {
    // Mapping logic based on Claude Code's PreToolUse protocol
    const tool = raw.tool_name || 'unknown';
    const actionType: ActionType = this.mapToolToType(tool);
    
    return {
      actor: { skill: { id: 'claude-code', source: 'official', version_ref: '1.0.0', artifact_hash: '' } },
      action: {
        type: actionType,
        data: raw.tool_input as ActionData
      },
      context: {
        session_id: raw.session_id || 'default',
        user_present: true,
        env: 'prod',
        time: new Date().toISOString()
      }
    };
  }

  private static fromOpenClaw(raw: any): ActionEnvelope {
    // Mapping logic for OpenClaw's plugin events
    return {
      actor: { skill: { id: raw.skillId || 'openclaw-plugin', source: 'local', version_ref: '1.0.0', artifact_hash: '' } },
      action: {
        type: (raw.actionType || 'exec_command') as ActionType,
        data: raw.params as ActionData
      },
      context: {
        session_id: 'openclaw-session',
        user_present: true,
        env: 'prod',
        time: new Date().toISOString()
      }
    };
  }

  private static fromParallelOrchestrator(raw: any): ActionEnvelope {
    // For Architecture 01, we might be intercepting high-level intents
    return {
      actor: { skill: { id: 'parallel-orchestrator', source: 'local', version_ref: '1.0.0', artifact_hash: '' } },
      action: {
        type: 'exec_command', // Defaulting for intent-level auditing
        data: { command: raw.prompt || '' } as ActionData
      },
      context: {
        session_id: 'parallel-session',
        user_present: true,
        env: 'prod',
        time: new Date().toISOString()
      }
    };
  }

  private static genericEnvelope(raw: any): ActionEnvelope {
    return {
      actor: { skill: { id: 'unknown', source: 'unknown', version_ref: '0.0.0', artifact_hash: '' } },
      action: { type: 'exec_command', data: { command: JSON.stringify(raw) } as any },
      context: { session_id: 'gen', user_present: false, env: 'dev', time: new Date().toISOString() }
    };
  }

  private static mapToolToType(tool: string): ActionType {
    const map: Record<string, ActionType> = {
      'Bash': 'exec_command',
      'Write': 'write_file',
      'Edit': 'write_file',
      'WebFetch': 'network_request'
    };
    return map[tool] || 'exec_command';
  }
}
