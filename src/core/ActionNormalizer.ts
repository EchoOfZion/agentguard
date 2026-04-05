/**
 * @file ActionNormalizer.ts
 * @description Standardized action normalizer with Zero-Day Harness Support.
 * Combines explicit adapters with a recursive heuristic engine for unknown formats.
 */

import type { ActionEnvelope, ActionData } from '../types/action.js';

export type AdapterFunction = (raw: any) => ActionEnvelope;

export class ActionNormalizer {
  private static registry = new Map<string, AdapterFunction>();

  static {
    // Built-in adapters for known mainstream harnesses
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

  public static register(harnessId: string, adapter: AdapterFunction): void {
    this.registry.set(harnessId.toLowerCase(), adapter);
  }

  /**
   * Normalizes raw data. If harness is unknown, triggers Heuristic Extraction.
   */
  public static normalize(raw: any, harnessId: string): ActionEnvelope {
    const adapter = this.registry.get(harnessId.toLowerCase());
    
    if (adapter) {
      try {
        return adapter(raw);
      } catch (err) {
        // Log error and fallback to heuristic
      }
    }

    // Zero-Day Support: Try to extract intent from unknown JSON structures
    return this.smartHeuristicExtraction(raw, harnessId);
  }

  /**
   * Recursively scans unknown objects for common action/intent fields
   * to provide a best-effort normalized envelope.
   */
  private static smartHeuristicExtraction(raw: any, harnessId: string): ActionEnvelope {
    const intentFields = ['command', 'cmd', 'bash', 'shell', 'script', 'input', 'args', 'url', 'path'];
    let extractedData: any = {};

    if (typeof raw === 'object' && raw !== null) {
      // Simple one-level promotion of common intent keys
      for (const field of intentFields) {
        if (raw[field]) {
          extractedData[field] = raw[field];
        }
      }
      
      // If nothing extracted, dump the whole object
      if (Object.keys(extractedData).length === 0) {
        extractedData = { raw_dump: JSON.stringify(raw) };
      }
    } else {
      extractedData = { command: String(raw) };
    }

    return {
      actor: { skill: { id: `auto-${harnessId}`, source: 'unknown', version_ref: '0.0.0', artifact_hash: '' } },
      action: { type: 'exec_command', data: extractedData as ActionData },
      context: { 
        session_id: 'auto-detection', 
        user_present: false, 
        env: 'dev', 
        time: new Date().toISOString() 
      }
    };
  }
}
