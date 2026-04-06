import type { ScanRule } from '../../types/scanner.js';

/**
 * Legal binding and contract acceptance detection rules.
 *
 * Prevents AI skills from autonomously signing agreements, accepting ToS,
 * bypassing CLA requirements, or interacting with e-signature platforms
 * without explicit user approval.
 *
 * Based on the Legal Guard specification:
 *   https://github.com/EchoOfZion/legal-guard
 */
export const LEGAL_BIND_RULES: ScanRule[] = [
  // -----------------------------------------------------------------------
  // Critical: skills that auto-accept agreements without user approval
  // -----------------------------------------------------------------------
  {
    id: 'AUTO_AGREEMENT',
    description:
      'Detects skills that auto-accept legal agreements, ToS, or contracts without user approval',
    severity: 'critical',
    file_patterns: ['*.md', '*.ts', '*.js', '*.py', '*.txt'],
    patterns: [
      // Explicit auto-accept language
      /auto(?:matically)?\s+(?:accept|agree|sign|approve)\s+(?:to\s+)?(?:the\s+)?(?:terms|agreement|contract|tos|eula|cla|license)/i,
      // Bypass language
      /bypass\s+(?:the\s+)?(?:agreement|terms|consent|confirmation|approval)\s+(?:check|gate|step|flow)/i,
      // Skip review
      /skip\s+(?:the\s+)?(?:legal|contract|agreement|terms)\s+(?:review|approval|confirmation)/i,
      // Accept without consent
      /(?:sign|accept|agree)\s+(?:to\s+)?(?:terms|agreement|contract).*without\s+(?:user\s+)?(?:approval|consent|confirmation|review)/i,
    ],
  },

  // -----------------------------------------------------------------------
  // Critical: automatic CLA acceptance on code repositories
  // -----------------------------------------------------------------------
  {
    id: 'CLA_AUTO_ACCEPT',
    description:
      'Detects automatic Contributor License Agreement (CLA) acceptance or bypass',
    severity: 'critical',
    file_patterns: ['*.md', '*.ts', '*.js', '*.sh', '*.py'],
    patterns: [
      // CLI flags that auto-accept CLA
      /--(?:auto-?accept-?cla|skip-?cla|accept-?cla)\b/i,
      // Programmatic CLA acceptance
      /(?:cla|contributor\s+license)\s+(?:agreement\s+)?(?:auto|automatic)/i,
      // Sign CLA without review
      /sign\s+(?:the\s+)?cla\s+(?:auto|without)/i,
    ],
  },

  // -----------------------------------------------------------------------
  // High: e-signature platform interactions
  // -----------------------------------------------------------------------
  {
    id: 'ESIGNATURE_PLATFORM',
    description:
      'Detects interactions with e-signature platforms requiring human-in-the-loop',
    severity: 'high',
    file_patterns: ['*.md', '*.ts', '*.js', '*.py', '*.txt'],
    patterns: [
      // Major e-signature platforms
      /(?:docusign\.(?:net|com)|hellosign\.com|adobesign\.com|sign\.adobe\.com)/i,
      /(?:pandadoc\.com|signnow\.com|eversign\.com|signrequest\.com)/i,
      // Generic e-sign API patterns
      /(?:e-?sign(?:ature)?|digital\s+sign(?:ature)?)\s+(?:api|sdk|client|integration)/i,
    ],
  },

  // -----------------------------------------------------------------------
  // High: UI interaction patterns that bind users legally
  // -----------------------------------------------------------------------
  {
    id: 'LEGAL_BIND_RISK',
    description:
      'Detects automated UI interactions that may bind users to legal obligations',
    severity: 'high',
    file_patterns: ['*.md', '*.ts', '*.js', '*.py'],
    patterns: [
      // Click "I Agree" / "Accept Terms" automation
      /click.*["'](?:I\s+Agree|Accept\s+(?:Terms|Agreement)|I\s+Accept|Agree\s+and\s+Continue)["']/i,
      // Programmatic acceptance buttons
      /(?:querySelector|getElementById|find|locate).*(?:accept-?terms|agree-?btn|sign-?agreement|tos-?accept)/i,
      // Checkbox acceptance automation
      /(?:check|toggle|set)\s+(?:the\s+)?(?:accept|agree|consent)\s+(?:checkbox|input)/i,
    ],
    validator: (content: string) => {
      // Only flag if there is actual automation context
      return /(?:click|submit|automate|execute|trigger|press|\.click\(\)|\.submit\(\))/i.test(content);
    },
  },

  // -----------------------------------------------------------------------
  // Medium: contract-adjacent document references
  // -----------------------------------------------------------------------
  {
    id: 'CONTRACT_DOCUMENT',
    description:
      'Detects references to contract documents that may require legal review',
    severity: 'medium',
    file_patterns: ['*.md', '*.ts', '*.js', '*.py', '*.txt'],
    patterns: [
      // Named agreement types
      /\b(?:NDA|Non[- ]Disclosure\s+Agreement)\b/,
      /\b(?:SAFT|Simple\s+Agreement\s+for\s+Future\s+Tokens)\b/i,
      /\b(?:SOW|Statement\s+of\s+Work)\b/,
      /\b(?:MSA|Master\s+Service\s+Agreement)\b/,
      /\bEmployment\s+Agreement\b/i,
      /\bLicense\s+Agreement\b/i,
    ],
    validator: (content: string) => {
      // Only flag if there is signing / acceptance automation
      return /(?:auto|sign|accept|submit|execute|click).*(?:agreement|contract|document)/i.test(content);
    },
  },

  // -----------------------------------------------------------------------
  // High: subscription signup with payment info
  // -----------------------------------------------------------------------
  {
    id: 'SUBSCRIPTION_SIGNUP',
    description:
      'Detects automated subscription or free-trial signup flows with payment info',
    severity: 'high',
    file_patterns: ['*.md', '*.ts', '*.js', '*.py', '*.txt'],
    patterns: [
      // Free trial + payment info
      /free\s+trial.*(?:credit\s+card|payment|billing)/i,
      // Subscription auto-renewal
      /subscription.*(?:auto[- ]?renew|automatic\s+renewal)/i,
      // Payment info entry automation
      /(?:enter|fill|input|submit).*(?:payment|billing|credit\s+card)\s+(?:info|details|data|form)/i,
    ],
    validator: (content: string) => {
      // Only flag if there is form filling or submission automation
      return /(?:fill|enter|input|submit|automate|\.value\s*=).*(?:form|field|input)/i.test(content);
    },
  },
];
