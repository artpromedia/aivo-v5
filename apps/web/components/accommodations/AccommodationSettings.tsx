'use client'

import { useCallback, useEffect, useMemo, useState } from "react";
import { Accommodation } from "@/lib/accommodations/accommodation-manager";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { AccommodationToggle } from "@/components/accommodations/AccommodationToggle";
import { EffectivenessChart, type AccommodationEffectivenessPoint } from "@/components/accommodations/EffectivenessChart";
import { cn } from "@/lib/utils";

const GROUPS: Array<{ title: string; subtitle?: string; accommodations: Accommodation[] }> = [
  {
    title: "Visual Supports",
    subtitle: "Reduce cognitive load and improve readability",
    accommodations: [
      Accommodation.TEXT_TO_SPEECH,
      Accommodation.INCREASED_FONT_SIZE,
      Accommodation.HIGH_CONTRAST,
      Accommodation.REDUCED_VISUAL_CLUTTER,
      Accommodation.VISUAL_SCHEDULES,
      Accommodation.COLOR_CODING,
      Accommodation.DYSLEXIA_FONT
    ]
  },
  {
    title: "Auditory & Motor",
    subtitle: "Adjust inputs and outputs for accessibility",
    accommodations: [
      Accommodation.CAPTIONS,
      Accommodation.AUDIO_INSTRUCTIONS,
      Accommodation.SLOWED_AUDIO,
      Accommodation.SPEECH_TO_TEXT,
      Accommodation.SIMPLIFIED_CONTROLS,
      Accommodation.LARGER_CLICK_TARGETS
    ]
  },
  {
    title: "Learning Supports",
    subtitle: "Chunk content and scaffold cognition",
    accommodations: [
      Accommodation.EXTRA_TIME,
      Accommodation.FREQUENT_BREAKS,
      Accommodation.REDUCED_CHOICES,
      Accommodation.CHUNKED_CONTENT,
      Accommodation.WORKED_EXAMPLES,
      Accommodation.STEP_BY_STEP
    ]
  },
  {
    title: "Behavioral & Emotional",
    accommodations: [
      Accommodation.ENCOURAGEMENT_PROMPTS,
      Accommodation.FIDGET_TOOLS,
      Accommodation.CALM_DOWN_STRATEGIES,
      Accommodation.CHOICE_IN_ACTIVITIES
    ]
  }
];

const COPY: Partial<Record<Accommodation, { label: string; description?: string }>> = {
  [Accommodation.TEXT_TO_SPEECH]: {
    label: "Text to speech",
    description: "Narrate written passages automatically"
  },
  [Accommodation.INCREASED_FONT_SIZE]: {
    label: "Larger font",
    description: "Use 18pt equivalent copy and relaxed line height"
  },
  [Accommodation.CHUNKED_CONTENT]: {
    label: "Chunked content",
    description: "Break lessons into digestible steps"
  },
  [Accommodation.FREQUENT_BREAKS]: {
    label: "Frequent brain breaks",
    description: "Prompt movement every 5 minutes"
  },
  [Accommodation.ENCOURAGEMENT_PROMPTS]: {
    label: "Encouragement",
    description: "Add encouraging micro-copy at each checkpoint"
  },
  [Accommodation.FIDGET_TOOLS]: {
    label: "Virtual fidget tools",
    description: "Embed tactile micro-interactions"
  }
};

interface AccommodationSettingsProps {
  learnerId: string;
}

export function AccommodationSettings({ learnerId }: AccommodationSettingsProps) {
  const [selected, setSelected] = useState<Accommodation[]>([]);
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [effectiveness, setEffectiveness] = useState<AccommodationEffectivenessPoint[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const loadPlan = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/learners/${learnerId}/accommodations`);
      if (!response.ok) throw new Error("Unable to load accommodations");
      const data = await response.json();
      setSelected((data.plan?.accommodations as Accommodation[]) ?? []);
      setNotes(data.plan?.notes ?? "");
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [learnerId]);

  const loadEffectiveness = useCallback(async () => {
    const response = await fetch(`/api/learners/${learnerId}/accommodations/effectiveness`);
    if (!response.ok) return;
    const data = await response.json();
    setEffectiveness(data.averages ?? []);
  }, [learnerId]);

  useEffect(() => {
    void loadPlan();
    void loadEffectiveness();
  }, [loadEffectiveness, loadPlan]);

  const persist = useCallback(
    async (next: Accommodation[]) => {
      setSaving(true);
      setMessage(null);
      try {
        const response = await fetch(`/api/learners/${learnerId}/accommodations`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accommodations: next, notes })
        });
        if (!response.ok) throw new Error("Failed to save accommodations");
        setSelected(next);
        setMessage("Accommodations updated");
      } catch (error) {
        setMessage((error as Error).message);
      } finally {
        setSaving(false);
      }
    },
    [learnerId, notes]
  );

  const toggleAccommodation = useCallback(
    (accommodation: Accommodation, enable: boolean) => {
      const next = enable ? Array.from(new Set([...selected, accommodation])) : selected.filter((item) => item !== accommodation);
      void persist(next);
    },
    [persist, selected]
  );

  const triggerAutoSetup = useCallback(async () => {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/learners/${learnerId}/accommodations/setup`, { method: "POST" });
      if (!response.ok) throw new Error("Auto-setup failed");
      const data = await response.json();
      setSelected(data.accommodations ?? []);
      setMessage("Auto-enabled based on diagnoses");
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setSaving(false);
    }
  }, [learnerId]);

  const effectivenessLookup = useMemo(() => {
    return effectiveness.reduce<Record<string, number>>((acc, entry) => {
      acc[String(entry.accommodation)] = (entry.engagement + entry.completion + entry.accuracy) / 3;
      return acc;
    }, {});
  }, [effectiveness]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Learning accommodations"
          subtitle="Enable supports per learner and monitor impact"
          action={
            <button
              type="button"
              onClick={() => void triggerAutoSetup()}
              disabled={saving}
              className={cn(
                "rounded-full border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700",
                saving ? "opacity-60" : "hover:border-blue-300"
              )}
            >
              Auto-enable from diagnoses
            </button>
          }
        />
        <CardContent>
          {message && <p className="mb-3 text-sm text-slate-600">{message}</p>}
          {loading ? (
            <p className="text-sm text-slate-500">Loading accommodations…</p>
          ) : (
            <div className="space-y-6">
              {GROUPS.map((group) => (
                <section key={group.title} className="space-y-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">{group.title}</h3>
                    {group.subtitle && <p className="text-sm text-slate-500">{group.subtitle}</p>}
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {group.accommodations.map((accommodation) => (
                      <AccommodationToggle
                        key={accommodation}
                        accommodation={accommodation}
                        label={COPY[accommodation]?.label}
                        description={COPY[accommodation]?.description}
                        enabled={selected.includes(accommodation)}
                        effectiveness={effectivenessLookup[accommodation]}
                        onToggle={(enabled) => toggleAccommodation(accommodation, enabled)}
                      />
                    ))}
                  </div>
                </section>
              ))}
              <div>
                <label className="text-sm font-medium text-slate-800">Notes for this learner</label>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Document sensory preferences, success indicators, or parent requests"
                />
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => void persist(selected)}
                    disabled={saving}
                    className={cn(
                      "rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white",
                      saving && "opacity-60"
                    )}
                  >
                    Save notes
                  </button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Accommodation effectiveness" subtitle="Rolling averages from recent sessions" />
        <CardContent>
          <EffectivenessChart data={effectiveness} />
        </CardContent>
      </Card>
    </div>
  );
}
