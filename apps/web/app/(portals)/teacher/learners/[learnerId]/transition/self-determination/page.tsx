'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { SelfDeterminationRadar, PersonCenteredPlanBuilder } from '@/components/transition';

/**
 * Self-Determination Page
 * Assessments, person-centered planning, goal setting
 */

// Sample assessment data - matches SelfDeterminationScores interface
const mockAssessmentData = {
  selfAwareness: 78,
  selfKnowledge: 75,
  choiceMaking: 75,
  decisionMaking: 68,
  goalSetting: 80,
  planning: 72,
  problemSolving: 72,
  selfAdvocacy: 65,
  selfRegulation: 70,
  selfEvaluation: 74,
  selfReinforcement: 77,
};

const mockPersonCenteredPlan = {
  dreams: ['Own my own shop', 'Buy a truck', 'Live on my own'],
  nightmares: ['Getting lost', 'New situations', 'Too much reading'],
  importantTo: ['Cars and trucks', 'Building things', 'Video games', 'Helping others'],
  importantFor: ['Visual schedules', 'Written instructions', 'Check-ins', 'Job coaching'],
  strengths: ['Hard worker', 'Good with hands', 'Learns well visually', 'Friendly personality'],
  gifts: ['Mechanical aptitude', 'Patience with detailed work'],
  talents: ['Fixing things', 'Problem-solving with hands'],
  interests: ['Cars', 'Technology', 'Building'],
  importantPeople: [
    { name: 'Mom (Sarah)', role: 'Primary support', relationship: 'Parent' },
    { name: 'Mr. Johnson', role: 'Job mentor', relationship: 'Employer' },
    { name: 'Coach Williams', role: 'Encouragement', relationship: 'Coach' },
  ],
};

const assessmentHistory = [
  { date: '2024-03-01', type: 'AIR Self-Determination Scale', overallScore: 72, status: 'completed' },
  { date: '2023-09-15', type: 'AIR Self-Determination Scale', overallScore: 65, status: 'completed' },
  { date: '2023-03-10', type: 'AIR Self-Determination Scale', overallScore: 58, status: 'completed' },
];

export default function SelfDeterminationPage() {
  const params = useParams();
  const [activeTab, setActiveTab] = useState<'assessment' | 'plan' | 'skills'>('assessment');

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <nav className="text-sm text-gray-500 mb-2">
            <a href="../transition" className="hover:text-indigo-600">Transition</a>
            <span className="mx-2">/</span>
            <span className="text-gray-900">Self-Determination</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900">Self-Determination</h1>
          <p className="text-gray-600">Assessment, person-centered planning, and skill development</p>
        </div>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          New Assessment
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Overall Score</div>
            <div className="text-2xl font-bold text-indigo-600">72</div>
            <div className="text-xs text-green-600">+7 from last assessment</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Strongest Area</div>
            <div className="text-lg font-bold">Goal Setting</div>
            <div className="text-xs text-gray-500">Score: 80/100</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Growth Area</div>
            <div className="text-lg font-bold">Self-Advocacy</div>
            <div className="text-xs text-gray-500">Score: 65/100</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Assessments</div>
            <div className="text-2xl font-bold">{assessmentHistory.length}</div>
            <div className="text-xs text-gray-500">over 18 months</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {[
            { id: 'assessment', label: 'Assessment', icon: '📊' },
            { id: 'plan', label: 'Person-Centered Plan', icon: '🎯' },
            { id: 'skills', label: 'Skill Development', icon: '📈' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Assessment Tab */}
      {activeTab === 'assessment' && (
        <div className="space-y-6">
          {/* Current Assessment Radar */}
          <SelfDeterminationRadar
            scores={mockAssessmentData}
            previousScores={{
              selfAwareness: 72,
              selfKnowledge: 70,
              choiceMaking: 68,
              decisionMaking: 62,
              goalSetting: 75,
              planning: 66,
              problemSolving: 66,
              selfAdvocacy: 60,
              selfRegulation: 64,
              selfEvaluation: 65,
              selfReinforcement: 70,
            }}
          />

          {/* Assessment History */}
          <Card>
            <CardHeader title="Assessment History" subtitle="Track progress over time" />
            <CardContent>
              <div className="space-y-3">
                {assessmentHistory.map((assessment, i) => (
                  <div 
                    key={i}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <h4 className="font-medium">{assessment.type}</h4>
                      <p className="text-sm text-gray-500">{assessment.date}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-lg font-bold">{assessment.overallScore}</div>
                        <div className="text-xs text-gray-500">Overall Score</div>
                      </div>
                      <button className="px-3 py-1 border rounded text-sm hover:bg-gray-100">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Assessment Interpretation */}
          <Card>
            <CardHeader title="Score Interpretation" />
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-green-700 mb-2">💪 Strengths (Score 75+)</h4>
                  <ul className="space-y-1 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">●</span>
                      Goal Setting (80) - Sets realistic, achievable goals
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">●</span>
                      Self-Awareness (78) - Understands own abilities and needs
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">●</span>
                      Positive Outcomes (77) - Expects effort to lead to results
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">●</span>
                      Choice Making (75) - Makes choices based on preferences
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-amber-700 mb-2">🎯 Growth Areas (Score &lt;70)</h4>
                  <ul className="space-y-1 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="text-amber-600">●</span>
                      Self-Advocacy (65) - Needs practice speaking up for needs
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-amber-600">●</span>
                      Decision Making (68) - Building decision-making confidence
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-amber-600">●</span>
                      Autonomy (69) - Developing independence skills
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Person-Centered Plan Tab */}
      {activeTab === 'plan' && (
        <PersonCenteredPlanBuilder
          plan={mockPersonCenteredPlan}
          learnerName="Student"
          onPlanUpdate={(plan) => console.log('Plan updated:', plan)}
        />
      )}

      {/* Skills Development Tab */}
      {activeTab === 'skills' && (
        <div className="space-y-6">
          {/* Active Skills Goals */}
          <Card>
            <CardHeader 
              title="Self-Determination Skills Goals" 
              subtitle="Working toward independence"
            />
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    skill: 'Self-Advocacy',
                    goal: 'Request accommodations independently in at least 3 settings',
                    progress: 1,
                    target: 3,
                    activities: ['Practice scripts', 'Role-play scenarios', 'Real-world practice'],
                  },
                  {
                    skill: 'Decision Making',
                    goal: 'Use decision-making framework for major choices',
                    progress: 2,
                    target: 4,
                    activities: ['Learn SODAS framework', 'Apply to small decisions', 'Apply to big decisions'],
                  },
                  {
                    skill: 'Problem Solving',
                    goal: 'Independently solve workplace problems using 4-step process',
                    progress: 3,
                    target: 5,
                    activities: ['Identify problem', 'Brainstorm solutions', 'Evaluate options', 'Try solution', 'Reflect'],
                  },
                ].map((goal, i) => (
                  <div key={i} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded">
                          {goal.skill}
                        </span>
                        <h4 className="font-medium mt-1">{goal.goal}</h4>
                      </div>
                      <span className="text-sm text-gray-500">
                        {goal.progress}/{goal.target} complete
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                      <div 
                        className="bg-indigo-500 h-2 rounded-full transition-all" 
                        style={{ width: `${(goal.progress / goal.target) * 100}%` }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {goal.activities.map((activity, j) => (
                        <span 
                          key={j}
                          className={`px-2 py-1 rounded text-xs ${
                            j < goal.progress 
                              ? 'bg-green-100 text-green-700 line-through' 
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {activity}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Skill Building Resources */}
          <Card>
            <CardHeader title="Skill Building Resources" />
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  {
                    title: 'Self-Advocacy Practice',
                    description: 'Role-play scenarios for requesting accommodations',
                    type: 'Interactive',
                    icon: '🎭',
                  },
                  {
                    title: 'Decision Making Framework',
                    description: 'SODAS method for making decisions',
                    type: 'Lesson',
                    icon: '🧠',
                  },
                  {
                    title: 'Goal Setting Workbook',
                    description: 'Create SMART transition goals',
                    type: 'Worksheet',
                    icon: '📝',
                  },
                  {
                    title: 'Problem Solving Steps',
                    description: '4-step process for solving problems',
                    type: 'Guide',
                    icon: '💡',
                  },
                  {
                    title: 'Self-Awareness Inventory',
                    description: 'Discover strengths, needs, preferences',
                    type: 'Assessment',
                    icon: '🔍',
                  },
                  {
                    title: 'IEP Meeting Prep',
                    description: 'Prepare to participate in your IEP meeting',
                    type: 'Checklist',
                    icon: '✅',
                  },
                ].map((resource, i) => (
                  <div 
                    key={i}
                    className="p-4 border rounded-lg hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer transition-colors"
                  >
                    <span className="text-2xl">{resource.icon}</span>
                    <h4 className="font-medium mt-2">{resource.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{resource.description}</p>
                    <span className="text-xs text-indigo-600 mt-2 inline-block">{resource.type}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Student Voice Section */}
          <Card>
            <CardHeader 
              title="Student Voice" 
              subtitle="The student's own words and perspectives"
            />
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-indigo-50 rounded-lg border-l-4 border-indigo-500">
                  <h4 className="font-medium text-indigo-900">My Goals</h4>
                  <p className="text-indigo-800 mt-1 italic">
                    "I want to work on cars and have my own place someday. I'm good at fixing things 
                    and I like learning by doing. I need help with reading long instructions."
                  </p>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                  <h4 className="font-medium text-green-900">What Helps Me Learn</h4>
                  <p className="text-green-800 mt-1 italic">
                    "I learn best when I can see how to do something first, then try it myself. 
                    I like when someone checks in with me to make sure I understand."
                  </p>
                </div>
                
                <div className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                  <h4 className="font-medium text-purple-900">What I'm Working On</h4>
                  <p className="text-purple-800 mt-1 italic">
                    "I'm practicing asking for help when I need it. Sometimes it's hard but 
                    I'm getting better at it. Mr. Johnson at the auto shop is helping me."
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
