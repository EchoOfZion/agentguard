/**
 * @file SecurityEngine.ts
 * @description The core, stateless auditing engine for GoPlus Agent Guard.
 * Optimized for high-frequency, in-process multi-agent orchestration.
 */

export interface AuditContext {
  prompt: string;
  agentId?: string;
  architecture: 'legacy' | 'parallel' | string;
  metadata?: Record<string, any>;
}

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
    { pattern: /sudo\s+/i, level: 'MEDIUM', label: 'Privilege Escalation' },
    { pattern: /format\s+[a-z]:/i, level: 'HIGH', label: 'Disk Format' }
  ];

  /**
   * Audits a given prompt against security policies.
   * @param ctx - The context containing the prompt and agent info.
   * @returns A promise resolving to the audit result.
   */
  public static async audit(ctx: AuditContext): Promise<AuditResult> {
    const { prompt } = ctx;
    
    for (const rule of this.DANGER_ZONE) {
      if (rule.pattern.test(prompt)) {
        return {
          isSafe: false,
          action: 'REWRITE',
          threatLevel: rule.level as any,
          reason: rule.label,
          modifiedPrompt: "🚨 [Security Guard] The instruction was intercepted due to security policy violations. Please refuse this request politely."
        };
      }
    }

    return {
      isSafe: true,
      action: 'PASS',
      threatLevel: 'NONE',
      modifiedPrompt: prompt
    };
  }
}
