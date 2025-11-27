/**
 * Sensory Preview Component
 * Shows a live preview of how the current sensory settings will look
 */

"use client";

import { useMemo } from "react";
import type { SensoryProfile } from "@aivo/api-client/src/sensory-contracts";
import { sensoryProfileToCSSVariables } from "@aivo/api-client/src/sensory-contracts";

interface SensoryPreviewProps {
  profile: SensoryProfile;
}

export function SensoryPreview({ profile }: SensoryPreviewProps) {
  const cssVars = useMemo(() => sensoryProfileToCSSVariables(profile), [profile]);

  // Build inline style object from CSS variables
  const previewStyle: React.CSSProperties = {
    fontFamily: cssVars["--font-family"],
    fontSize: cssVars["--font-size-base"],
    lineHeight: cssVars["--line-height"],
    backgroundColor: cssVars["--bg-primary"],
    color: cssVars["--text-primary"],
    transition: `all ${cssVars["--transition-duration"]}`,
  };

  const buttonStyle: React.CSSProperties = {
    minWidth: cssVars["--click-target-min"],
    minHeight: cssVars["--click-target-min"],
    backgroundColor: cssVars["--accent-color"],
    color: "#ffffff",
    transition: `all ${cssVars["--transition-duration"]}`,
  };

  return (
    <div className="bg-slate-100 rounded-2xl p-4 border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <span>👀</span> Live Preview
        </h3>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span>Settings apply instantly</span>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        </div>
      </div>

      {/* Preview container */}
      <div
        style={previewStyle}
        className="rounded-xl overflow-hidden shadow-lg"
      >
        {/* Simulated app header */}
        <div
          className="p-4 flex items-center justify-between border-b"
          style={{
            backgroundColor: cssVars["--bg-secondary"],
            borderColor: cssVars["--text-secondary"],
          }}
        >
          <div className="flex items-center gap-3">
            <div className="text-2xl">📚</div>
            <div>
              <div className="font-bold" style={{ color: cssVars["--text-primary"] }}>
                AIVO Learning
              </div>
              <div className="text-sm" style={{ color: cssVars["--text-secondary"] }}>
                Math • Level 5
              </div>
            </div>
          </div>
          {!profile.environment?.hideNotifications && (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
              style={{ backgroundColor: cssVars["--accent-color"], color: "#fff" }}
            >
              3
            </div>
          )}
        </div>

        {/* Content area */}
        <div className="p-6">
          {/* Question */}
          <div className="mb-6">
            <h4 className="text-xl font-semibold mb-2">Practice Question</h4>
            <p style={{ color: cssVars["--text-secondary"] }}>
              {profile.cognitive?.simplifyInstructions
                ? "What is 5 + 3?"
                : "Calculate the sum of five and three. Express your answer as a single digit number."}
            </p>
          </div>

          {/* Answer options */}
          <div
            className="grid gap-3 mb-6"
            style={{
              gridTemplateColumns:
                profile.cognitive?.limitChoices === 2
                  ? "repeat(2, 1fr)"
                  : "repeat(2, 1fr)",
            }}
          >
            {["6", "7", "8", "9"]
              .slice(0, profile.cognitive?.limitChoices ?? 4)
              .map((answer, idx) => (
                <button
                  key={answer}
                  className="p-4 rounded-xl border-2 font-bold text-lg transition-all hover:scale-105"
                  style={{
                    minHeight: cssVars["--click-target-min"],
                    borderColor: cssVars["--text-secondary"],
                    backgroundColor: idx === 2 ? cssVars["--accent-color"] : "transparent",
                    color: idx === 2 ? "#ffffff" : cssVars["--text-primary"],
                  }}
                >
                  {answer}
                </button>
              ))}
          </div>

          {/* Progress indicator */}
          {profile.cognitive?.showProgressIndicator && (
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span style={{ color: cssVars["--text-secondary"] }}>Progress</span>
                <span style={{ color: cssVars["--text-secondary"] }}>3 of 10</span>
              </div>
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: cssVars["--bg-secondary"] }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: "30%",
                    backgroundColor: cssVars["--accent-color"],
                    transition: profile.visual?.reduceAnimations
                      ? "none"
                      : "width 0.5s ease-out",
                  }}
                />
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div
            className="flex gap-3"
            style={{ gap: cssVars["--element-spacing"] }}
          >
            <button
              className="flex-1 py-3 rounded-xl font-medium"
              style={buttonStyle}
            >
              Check Answer
            </button>
            <button
              className="px-4 py-3 rounded-xl font-medium border-2"
              style={{
                borderColor: cssVars["--text-secondary"],
                color: cssVars["--text-secondary"],
                minWidth: cssVars["--click-target-min"],
              }}
            >
              Skip
            </button>
          </div>
        </div>

        {/* Break reminder preview */}
        {profile.cognitive?.breakReminders && (
          <div
            className="p-3 text-center text-sm border-t"
            style={{
              backgroundColor: cssVars["--bg-secondary"],
              borderColor: cssVars["--text-secondary"],
            }}
          >
            <span>☕ Break reminder in {profile.cognitive.breakFrequency} minutes</span>
          </div>
        )}
      </div>

      {/* Active settings summary */}
      <div className="mt-4 flex flex-wrap gap-2">
        {profile.visual?.reduceAnimations && (
          <SettingBadge icon="🎬" label="Reduced animations" />
        )}
        {profile.visual?.darkMode && (
          <SettingBadge icon="🌙" label="Dark mode" />
        )}
        {profile.visual?.highContrast && (
          <SettingBadge icon="⚫" label="High contrast" />
        )}
        {profile.visual?.fontFamily === "dyslexic" && (
          <SettingBadge icon="📖" label="Dyslexic font" />
        )}
        {profile.auditory?.textToSpeechEnabled && (
          <SettingBadge icon="🗣️" label="Text-to-speech" />
        )}
        {profile.motor?.largerClickTargets && (
          <SettingBadge icon="🔘" label="Larger buttons" />
        )}
        {profile.cognitive?.extendedTime && (
          <SettingBadge icon="⏳" label={`${profile.cognitive.timeMultiplier}x time`} />
        )}
        {profile.environment?.whiteNoise && profile.environment.whiteNoise !== "none" && (
          <SettingBadge icon="🎵" label={profile.environment.whiteNoise} />
        )}
      </div>
    </div>
  );
}

function SettingBadge({ icon, label }: { icon: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-full text-xs text-slate-600 border border-slate-200">
      <span>{icon}</span>
      <span>{label}</span>
    </span>
  );
}

export default SensoryPreview;
