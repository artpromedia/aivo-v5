type TemplateRenderer = (data: Record<string, unknown>) => { html: string; text: string };

const templateMap: Record<string, TemplateRenderer> = {
  "difficulty-change-request": (data) => {
    const learnerId = data.learnerId as string | undefined;
    const currentLevel = data.currentLevel ?? "-";
    const recommendedLevel = data.recommendedLevel ?? "-";
    const reasoning = data.reasoning ?? "Review the learner's recent focus data.";
    const approvalLink = data.approvalLink as string | undefined;

    const text = `AIVO recommended adjusting difficulty for learner ${learnerId}.
Current level: ${currentLevel}
Suggested level: ${recommendedLevel}
Reasoning: ${reasoning}
${approvalLink ? "Review: " + approvalLink : ""}`;

    const html = `
      <div style="font-family: 'Segoe UI', sans-serif; line-height: 1.6; color: #0f172a;">
        <h2 style="margin: 0 0 8px;">Learning level adjustment requested</h2>
        <p style="margin: 0 0 12px;">We spotted consistent mastery patterns and recommend a gentle level change.</p>
        <ul style="padding-left: 20px; margin: 0 0 12px;">
          <li><strong>Learner:</strong> ${learnerId ?? 'Unknown'}</li>
          <li><strong>Current level:</strong> ${currentLevel}</li>
          <li><strong>Suggested level:</strong> ${recommendedLevel}</li>
        </ul>
        <p style="margin: 0 0 12px;"><strong>Reasoning:</strong> ${reasoning}</p>
        ${approvalLink ? `<a href="${approvalLink}" style="display:inline-block;padding:10px 16px;background:#312e81;color:#fff;border-radius:9999px;text-decoration:none;">Review & Respond</a>` : ''}
      </div>
    `;

    return { html, text };
  },
  "focus-alert": (data) => {
    const learnerName = data.learnerName ?? "The learner";
    const focusScore = data.focusScore ?? "--";
    const distractionCount = data.distractionCount ?? "--";

    const text = `${learnerName} triggered a focus break.
Focus score: ${focusScore}
Distractions observed: ${distractionCount}`;

    const html = `
      <div style="font-family: 'Segoe UI', sans-serif; line-height: 1.6; color: #0f172a;">
        <h2 style="margin: 0 0 8px;">We noticed a focus wobble</h2>
        <p style="margin: 0 0 12px;">${learnerName} entered a brain break moment. Here is the latest snapshot:</p>
        <ul style="padding-left: 20px; margin: 0 0 12px;">
          <li><strong>Focus score:</strong> ${focusScore}</li>
          <li><strong>Distractions observed:</strong> ${distractionCount}</li>
        </ul>
        <p style="margin: 0;">Consider a quick sensory reset or encouragement check-in.</p>
      </div>
    `;

    return { html, text };
  }
};

export function renderNotificationTemplate(template: string, data: Record<string, unknown>) {
  const renderer = templateMap[template] ?? defaultRenderer;
  return renderer(data);
}

const defaultRenderer: TemplateRenderer = (data) => {
  const keys = Object.entries(data)
    .map(([key, value]) => `<li><strong>${key}</strong>: ${String(value)}</li>`)
    .join("");

  const html = `
    <div style="font-family: 'Segoe UI', sans-serif; line-height: 1.6; color: #0f172a;">
      <p>New notification from AIVO:</p>
      <ul style="padding-left: 20px;">${keys}</ul>
    </div>
  `;

  const text = `New AIVO notification:\n${Object.entries(data)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n")}`;

  return { html, text };
};
