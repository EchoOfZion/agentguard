/**
 * @file SecurityEngine.ts
 * @description Core security engine for GoPlus Agent Guard.
 * Stateless and optimized for memory-level auditing.
 */

import type { ActionEnvelope } from '../types/action.js';

export interface AuditResult {
  isSafe: boolean;
  action: 'PASS' | 'REWRITE' | 'BLOCK';
  modifiedPrompt: string;
  threatLevel: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
  reason?: string;
}

export class SecurityEngine {
  private static readonly DANGER_ZONE = [
    { pattern: /rm\s+-rf/i, level: 'HIGH', label: 'Filesystem Destruction' },
    { pattern: /delete\s+from/i, level: 'HIGH', label: 'Database Wipe' },
    { pattern: /sudo\s+/i, level: 'MEDIUM', label: 'Privilege Escalation' }
  ];

  public static async auditAction(envelope: ActionEnvelope): Promise<AuditResult> {
    const { action } = envelope;
    const actionStr = JSON.stringify(action.data);
    
    for (const rule of this.DANGER_ZONE) {
      if (rule.pattern.test(actionStr)) {
        return {
          isSafe: false,
          action: 'REWRITE',
          threatLevel: rule.level as any,
          reason: rule.label,
          modifiedPrompt: "Instruction blocked due to security policy violation."
        };
      }
    }

    return { isSafe: true, action: 'PASS', threatLevel: 'NONE', modifiedPrompt: '' };
  }
}
