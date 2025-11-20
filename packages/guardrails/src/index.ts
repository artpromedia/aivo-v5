export interface SafetyScanResult {
  flagged: boolean;
  type?: "self_harm" | "violence" | "abuse" | "inappropriate_language";
  severity?: "watch" | "concern" | "critical";
  matches?: string[];
}

const SELF_HARM_KEYWORDS = [
  "hurt myself",
  "end my life",
  "suicide",
  "kill myself",
  "self harm"
];

const VIOLENCE_KEYWORDS = ["kill", "attack", "violent", "shoot", "hurt you"];

const ABUSE_KEYWORDS = ["abuse", "bully", "harassed", "threatened"];

export function applyToneGuidelines(prompt: string, selProfile?: unknown): string {
  const prefix =
    "You are a calm, neurodiversity-aware tutor. Keep language predictable, offer optional breaks,"
    + " and avoid overwhelming sensory cues.";
  const profileNotes = selProfile ? `\nLearner support profile: ${JSON.stringify(selProfile)}.` : "";
  return `${prefix}${profileNotes}\n\n${prompt}`;
}

export function scanForSafetyConcerns(text: string): SafetyScanResult {
  const lower = text.toLowerCase();
  const matches = new Set<string>();
  let type: SafetyScanResult["type"];
  let severity: SafetyScanResult["severity"];

  for (const phrase of SELF_HARM_KEYWORDS) {
    if (lower.includes(phrase)) {
      matches.add(phrase);
      type = "self_harm";
      severity = "critical";
    }
  }

  if (!type) {
    for (const phrase of VIOLENCE_KEYWORDS) {
      if (lower.includes(phrase)) {
        matches.add(phrase);
        type = "violence";
        severity = "concern";
      }
    }
  }

  if (!type) {
    for (const phrase of ABUSE_KEYWORDS) {
      if (lower.includes(phrase)) {
        matches.add(phrase);
        type = "abuse";
        severity = "watch";
      }
    }
  }

  if (matches.size === 0) {
    return { flagged: false };
  }

  return {
    flagged: true,
    type,
    severity,
    matches: Array.from(matches)
  };
}
