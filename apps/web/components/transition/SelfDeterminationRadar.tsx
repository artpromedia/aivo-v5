'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';

interface SelfDeterminationScores {
  selfAwareness: number;
  selfKnowledge: number;
  choiceMaking: number;
  decisionMaking: number;
  goalSetting: number;
  planning: number;
  problemSolving: number;
  selfAdvocacy: number;
  selfRegulation: number;
  selfEvaluation: number;
  selfReinforcement: number;
}

interface SelfDeterminationRadarProps {
  scores: SelfDeterminationScores;
  previousScores?: SelfDeterminationScores;
  maxScore?: number;
  strengths?: string[];
  areasForGrowth?: string[];
  onDomainClick?: (domain: keyof SelfDeterminationScores) => void;
}

const DOMAIN_LABELS: Record<keyof SelfDeterminationScores, { label: string; description: string }> = {
  selfAwareness: { label: 'Self-Awareness', description: 'Understanding own strengths, weaknesses, and needs' },
  selfKnowledge: { label: 'Self-Knowledge', description: 'Understanding disability and support needs' },
  choiceMaking: { label: 'Choice-Making', description: 'Making choices based on preferences' },
  decisionMaking: { label: 'Decision-Making', description: 'Weighing options and considering consequences' },
  goalSetting: { label: 'Goal-Setting', description: 'Setting meaningful, achievable goals' },
  planning: { label: 'Planning', description: 'Creating action plans to achieve goals' },
  problemSolving: { label: 'Problem-Solving', description: 'Identifying and resolving challenges' },
  selfAdvocacy: { label: 'Self-Advocacy', description: 'Speaking up for oneself and needs' },
  selfRegulation: { label: 'Self-Regulation', description: 'Managing behavior and emotions' },
  selfEvaluation: { label: 'Self-Evaluation', description: 'Reflecting on own performance' },
  selfReinforcement: { label: 'Self-Reinforcement', description: 'Recognizing and celebrating accomplishments' },
};

const DOMAIN_COLORS: Record<string, string> = {
  selfAwareness: '#3B82F6',
  selfKnowledge: '#8B5CF6',
  choiceMaking: '#EC4899',
  decisionMaking: '#F59E0B',
  goalSetting: '#10B981',
  planning: '#06B6D4',
  problemSolving: '#6366F1',
  selfAdvocacy: '#EF4444',
  selfRegulation: '#84CC16',
  selfEvaluation: '#F97316',
  selfReinforcement: '#14B8A6',
};

export function SelfDeterminationRadar({
  scores,
  previousScores,
  maxScore = 5,
  strengths = [],
  areasForGrowth = [],
  onDomainClick,
}: SelfDeterminationRadarProps) {
  const domains = Object.keys(DOMAIN_LABELS) as (keyof SelfDeterminationScores)[];
  const totalScore = domains.reduce((sum, d) => sum + scores[d], 0);
  const maxTotalScore = domains.length * maxScore;
  const percentage = Math.round((totalScore / maxTotalScore) * 100);

  // Calculate radar chart points
  const centerX = 150;
  const centerY = 150;
  const maxRadius = 120;

  const getPoint = (index: number, value: number, total: number) => {
    const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
    const radius = (value / maxScore) * maxRadius;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  };

  const currentPoints = domains.map((_, i) => getPoint(i, scores[domains[i]], domains.length));
  const previousPoints = previousScores
    ? domains.map((_, i) => getPoint(i, previousScores[domains[i]], domains.length))
    : null;

  const currentPath = currentPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
  const previousPath = previousPoints
    ? previousPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'
    : '';

  // Grid circles
  const gridCircles = [1, 2, 3, 4, 5].map((level) => (
    <circle
      key={level}
      cx={centerX}
      cy={centerY}
      r={(level / maxScore) * maxRadius}
      fill="none"
      stroke="#E5E7EB"
      strokeWidth="1"
    />
  ));

  // Axis lines
  const axisLines = domains.map((_, i) => {
    const point = getPoint(i, maxScore, domains.length);
    return (
      <line
        key={i}
        x1={centerX}
        y1={centerY}
        x2={point.x}
        y2={point.y}
        stroke="#E5E7EB"
        strokeWidth="1"
      />
    );
  });

  // Domain labels around the chart
  const labelPoints = domains.map((domain, i) => {
    const point = getPoint(i, maxScore + 0.8, domains.length);
    return { domain, ...point };
  });

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card className="bg-gradient-to-r from-theme-primary to-indigo-600 text-white">
        <CardContent className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium opacity-90">Self-Determination Score</h3>
              <p className="text-4xl font-bold mt-1">{totalScore}/{maxTotalScore}</p>
              <p className="text-sm opacity-75 mt-1">{percentage}% of maximum</p>
            </div>
            <div className="text-right">
              <div className="text-6xl font-bold opacity-90">{percentage}%</div>
              {previousScores && (
                <p className="text-sm opacity-75">
                  {totalScore > domains.reduce((s, d) => s + previousScores[d], 0)
                    ? '↑ Improved'
                    : totalScore < domains.reduce((s, d) => s + previousScores[d], 0)
                    ? '↓ Declined'
                    : '→ Stable'}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Radar Chart */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">11 Domains of Self-Determination</h3>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <svg width="320" height="320" viewBox="0 0 300 300">
              {/* Grid */}
              {gridCircles}
              {axisLines}

              {/* Previous scores (if available) */}
              {previousPath && (
                <path
                  d={previousPath}
                  fill="rgba(156, 163, 175, 0.2)"
                  stroke="#9CA3AF"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
              )}

              {/* Current scores */}
              <path
                d={currentPath}
                fill="rgba(99, 102, 241, 0.3)"
                stroke="#6366F1"
                strokeWidth="2"
              />

              {/* Data points */}
              {currentPoints.map((point, i) => (
                <circle
                  key={i}
                  cx={point.x}
                  cy={point.y}
                  r="5"
                  fill={DOMAIN_COLORS[domains[i]]}
                  stroke="white"
                  strokeWidth="2"
                  className="cursor-pointer hover:r-7 transition-all"
                  onClick={() => onDomainClick?.(domains[i])}
                />
              ))}

              {/* Labels */}
              {labelPoints.map(({ domain, x, y }) => (
                <text
                  key={domain}
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-[8px] fill-gray-600 font-medium cursor-pointer hover:fill-indigo-600"
                  onClick={() => onDomainClick?.(domain)}
                >
                  {DOMAIN_LABELS[domain].label.split('-').join('\n')}
                </text>
              ))}
            </svg>
          </div>

          {/* Legend */}
          {previousScores && (
            <div className="flex justify-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-indigo-500" />
                <span>Current</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-gray-400 border-dashed border-t-2" />
                <span>Previous</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Domain Details */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Strengths */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-green-600">💪 Strengths</h3>
          </CardHeader>
          <CardContent>
            {strengths.length > 0 ? (
              <ul className="space-y-2">
                {strengths.map((strength, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="space-y-2">
                {domains
                  .filter((d) => scores[d] >= 4)
                  .map((domain) => (
                    <div key={domain} className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>{DOMAIN_LABELS[domain].label}</span>
                      <span className="text-sm text-gray-500">({scores[domain]}/5)</span>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Areas for Growth */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-amber-600">🎯 Areas for Growth</h3>
          </CardHeader>
          <CardContent>
            {areasForGrowth.length > 0 ? (
              <ul className="space-y-2">
                {areasForGrowth.map((area, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-amber-500">→</span>
                    <span>{area}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="space-y-2">
                {domains
                  .filter((d) => scores[d] <= 2)
                  .map((domain) => (
                    <div key={domain} className="flex items-center gap-2">
                      <span className="text-amber-500">→</span>
                      <span>{DOMAIN_LABELS[domain].label}</span>
                      <span className="text-sm text-gray-500">({scores[domain]}/5)</span>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* All Domains Breakdown */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Domain Breakdown</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {domains.map((domain) => {
              const score = scores[domain];
              const prevScore = previousScores?.[domain];
              const change = prevScore ? score - prevScore : 0;
              
              return (
                <div
                  key={domain}
                  className="cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                  onClick={() => onDomainClick?.(domain)}
                >
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: DOMAIN_COLORS[domain] }}
                      />
                      <span className="font-medium">{DOMAIN_LABELS[domain].label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{score}/{maxScore}</span>
                      {change !== 0 && (
                        <span className={`text-xs ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {change > 0 ? '+' : ''}{change}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(score / maxScore) * 100}%`,
                        backgroundColor: DOMAIN_COLORS[domain],
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{DOMAIN_LABELS[domain].description}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SelfDeterminationRadar;
