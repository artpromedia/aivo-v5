'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';

interface ReadinessScores {
  overallScore: number;
  educationReadiness: number;
  employmentReadiness: number;
  independentLivingReadiness: number;
  selfDeterminationReadiness: number;
}

interface SkillsAssessment {
  reading?: number;
  writing?: number;
  math?: number;
  technology?: number;
}

interface IDEARequirement {
  name: string;
  met: boolean;
  notes?: string;
}

interface TransitionReadinessReportProps {
  learnerName: string;
  reportDate: string;
  scores: ReadinessScores;
  academicSkills?: SkillsAssessment;
  employabilitySkills?: SkillsAssessment;
  dailyLivingSkills?: SkillsAssessment;
  ideaRequirements: IDEARequirement[];
  recommendations: string[];
  priorityAreas: string[];
  strengthAreas: string[];
  nextSteps: Array<{ action: string; responsible: string; deadline: string }>;
  preparedBy?: string;
}

const ScoreGauge = ({ score, label, color }: { score: number; label: string; color: string }) => {
  const getScoreLabel = (s: number) => {
    if (s >= 80) return 'Ready';
    if (s >= 60) return 'Developing';
    if (s >= 40) return 'Emerging';
    return 'Beginning';
  };

  return (
    <div className="text-center">
      <div className="relative inline-flex items-center justify-center">
        <svg className="w-24 h-24">
          {/* Background circle */}
          <circle
            cx="48"
            cy="48"
            r="40"
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="48"
            cy="48"
            r="40"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${(score / 100) * 251.2} 251.2`}
            transform="rotate(-90 48 48)"
          />
        </svg>
        <span className="absolute text-2xl font-bold">{score}%</span>
      </div>
      <p className="mt-2 font-medium">{label}</p>
      <p className={`text-sm ${score >= 60 ? 'text-green-600' : score >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
        {getScoreLabel(score)}
      </p>
    </div>
  );
};

const SkillBar = ({ skill, score }: { skill: string; score: number }) => (
  <div className="mb-2">
    <div className="flex justify-between text-sm mb-1">
      <span>{skill}</span>
      <span className="font-medium">{score}%</span>
    </div>
    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full ${
          score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-blue-500' : score >= 40 ? 'bg-amber-500' : 'bg-red-500'
        }`}
        style={{ width: `${score}%` }}
      />
    </div>
  </div>
);

export function TransitionReadinessReport({
  learnerName,
  reportDate,
  scores,
  academicSkills,
  employabilitySkills,
  dailyLivingSkills,
  ideaRequirements,
  recommendations,
  priorityAreas,
  strengthAreas,
  nextSteps,
  preparedBy,
}: TransitionReadinessReportProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const requirementsMet = ideaRequirements.filter(r => r.met).length;
  const compliancePercent = Math.round((requirementsMet / ideaRequirements.length) * 100);

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white print:bg-blue-600">
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold">Transition Readiness Report</h1>
              <p className="text-xl mt-1">{learnerName}</p>
              <p className="opacity-90 mt-2">Report Date: {formatDate(reportDate)}</p>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold">{scores.overallScore}%</div>
              <p className="text-sm opacity-90">Overall Readiness</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Readiness Scores */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Readiness by Domain</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <ScoreGauge
              score={scores.educationReadiness}
              label="Post-Secondary Education"
              color="#3B82F6"
            />
            <ScoreGauge
              score={scores.employmentReadiness}
              label="Employment"
              color="#10B981"
            />
            <ScoreGauge
              score={scores.independentLivingReadiness}
              label="Independent Living"
              color="#8B5CF6"
            />
            <ScoreGauge
              score={scores.selfDeterminationReadiness}
              label="Self-Determination"
              color="#F59E0B"
            />
          </div>
        </CardContent>
      </Card>

      {/* Skills Assessment */}
      <div className="grid md:grid-cols-3 gap-4">
        {academicSkills && (
          <Card>
            <CardHeader>
              <h3 className="font-semibold">📚 Academic Skills</h3>
            </CardHeader>
            <CardContent>
              {Object.entries(academicSkills).map(([skill, score]) => (
                <SkillBar key={skill} skill={skill.charAt(0).toUpperCase() + skill.slice(1)} score={score || 0} />
              ))}
            </CardContent>
          </Card>
        )}

        {employabilitySkills && (
          <Card>
            <CardHeader>
              <h3 className="font-semibold">💼 Employability Skills</h3>
            </CardHeader>
            <CardContent>
              {Object.entries(employabilitySkills).map(([skill, score]) => (
                <SkillBar key={skill} skill={skill.charAt(0).toUpperCase() + skill.slice(1)} score={score || 0} />
              ))}
            </CardContent>
          </Card>
        )}

        {dailyLivingSkills && (
          <Card>
            <CardHeader>
              <h3 className="font-semibold">🏠 Daily Living Skills</h3>
            </CardHeader>
            <CardContent>
              {Object.entries(dailyLivingSkills).map(([skill, score]) => (
                <SkillBar key={skill} skill={skill.charAt(0).toUpperCase() + skill.slice(1)} score={score || 0} />
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* IDEA Compliance */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">IDEA Transition Requirements Compliance</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              compliancePercent === 100
                ? 'bg-green-100 text-green-800'
                : compliancePercent >= 70
                ? 'bg-amber-100 text-amber-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {compliancePercent}% Compliant
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-3">
            {ideaRequirements.map((req, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg border ${
                  req.met
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className={`mt-0.5 ${req.met ? 'text-green-600' : 'text-red-600'}`}>
                    {req.met ? '✓' : '✗'}
                  </span>
                  <div>
                    <p className={`font-medium ${req.met ? 'text-green-800' : 'text-red-800'}`}>
                      {req.name}
                    </p>
                    {req.notes && (
                      <p className="text-sm text-gray-600 mt-1">{req.notes}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Strengths & Priority Areas */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-green-700">💪 Strength Areas</h3>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {strengthAreas.map((area, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span>{area}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-semibold text-amber-700">🎯 Priority Areas for Growth</h3>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {priorityAreas.map((area, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-amber-500">→</span>
                  <span>{area}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">📋 Recommendations</h2>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">
                  {i + 1}
                </span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">📅 Next Steps</h2>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">Action</th>
                  <th className="text-left py-2 px-3">Responsible Party</th>
                  <th className="text-left py-2 px-3">Target Date</th>
                </tr>
              </thead>
              <tbody>
                {nextSteps.map((step, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-3">{step.action}</td>
                    <td className="py-2 px-3">{step.responsible}</td>
                    <td className="py-2 px-3">{step.deadline}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <div>
              {preparedBy && <p>Prepared by: {preparedBy}</p>}
              <p>Generated: {formatDate(new Date().toISOString())}</p>
            </div>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900 print:hidden"
            >
              🖨️ Print Report
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default TransitionReadinessReport;
