/**
 * @file SecurityEngine.ts
 * @description The core, stateless auditing engine for GoPlus Agent Guard.
 */

import type { ActionEnvelope, ActionType } from '../types/action.js';

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

  /**
   * Audits an ActionEnvelope (Normalized Action).
   */
  public static async auditAction(envelope: ActionEnvelope): Promise<AuditResult> {
    const { action } = envelope;
    console.log(`[SecurityEngine]  Auditing standardized action: ${action.type}`);

    // Basic pattern matching on serialized action data
    const actionStr = JSON.stringify(action.data);
    
    for (const rule of this.DANGER_ZONE) {
      if (rule.pattern.test(actionStr)) {
        return {
          isSafe: false,
          action: 'REWRITE',
          threatLevel: rule.level as any,
          reason: rule.label,
          modifiedPrompt: " [Security Guard] Standardized action blocked due to policy violation."
        };
      }
    }

    return { isSafe: true, action: 'PASS', threatLevel: 'NONE', modifiedPrompt: '' };
  }

  /**
   * Legacy support for raw prompt auditing.
   */
  public static async auditRaw(prompt: string): Promise<AuditResult> {
    for (const rule of this.DANGER_ZONE) {
      if (rule.pattern.test(prompt)) {
        return {
          isSafe: false,
          action: 'REWRITE',
          threatLevel: rule.level as any,
          reason: rule.label,
          modifiedPrompt: " [Security Guard] Raw prompt blocked."
        };
      }
    }
    return { isSafe: true, action: 'PASS', threatLevel: 'NONE', modifiedPrompt: prompt };
  }
}
