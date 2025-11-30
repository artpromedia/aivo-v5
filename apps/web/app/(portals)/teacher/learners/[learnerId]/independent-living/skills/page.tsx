'use client';

import React, { useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ILSSkillBrowser, TaskAnalysisViewer } from '@/components/ils';
import { ArrowLeft, Plus, Search } from 'lucide-react';

/**
 * Skills Catalog Page
 * Browse and manage functional living skills
 */

// Mock skills data - replace with API calls
const mockSkills = [
  {
    id: 'skill-1',
    name: 'Identifying Coins',
    domain: 'MONEY_MANAGEMENT',
    description: 'Recognize and name penny, nickel, dime, and quarter',
    taskAnalysisSteps: [
      { stepNumber: 1, description: 'Pick up coin', supportLevel: 'INDEPENDENT', promptHierarchy: ['INDEPENDENT'] },
      { stepNumber: 2, description: 'Look at size and color', supportLevel: 'INDEPENDENT', promptHierarchy: ['INDEPENDENT'] },
      { stepNumber: 3, description: 'Name the coin', supportLevel: 'VERBAL', promptHierarchy: ['VERBAL', 'INDEPENDENT'] },
    ],
    prerequisiteSkillIds: [],
    ageAppropriateStart: 5,
    ageAppropriateEnd: 12,
    difficultyLevel: 1,
    targetSettings: ['classroom', 'home', 'store'],
    materialsNeeded: ['Real coins', 'Coin sorting tray'],
    isActive: true,
    totalSteps: 3,
    isCriticalSafety: false,
    communityRelevance: 5,
    employmentRelevance: 3,
  },
  {
    id: 'skill-2',
    name: 'Counting Coins to $1.00',
    domain: 'MONEY_MANAGEMENT',
    description: 'Count mixed coins up to one dollar',
    taskAnalysisSteps: [
      { stepNumber: 1, description: 'Sort coins by type', supportLevel: 'VERBAL', promptHierarchy: ['VERBAL', 'INDEPENDENT'] },
      { stepNumber: 2, description: 'Count quarters first', supportLevel: 'VERBAL', promptHierarchy: ['VERBAL', 'INDEPENDENT'] },
      { stepNumber: 3, description: 'Add dimes', supportLevel: 'MODEL', promptHierarchy: ['MODEL', 'VERBAL', 'INDEPENDENT'] },
      { stepNumber: 4, description: 'Add nickels', supportLevel: 'MODEL', promptHierarchy: ['MODEL', 'VERBAL', 'INDEPENDENT'] },
      { stepNumber: 5, description: 'Add pennies', supportLevel: 'INDEPENDENT', promptHierarchy: ['INDEPENDENT'] },
      { stepNumber: 6, description: 'State total amount', supportLevel: 'VERBAL', promptHierarchy: ['VERBAL', 'INDEPENDENT'] },
    ],
    prerequisiteSkillIds: ['skill-1'],
    ageAppropriateStart: 7,
    ageAppropriateEnd: 14,
    difficultyLevel: 2,
    targetSettings: ['classroom', 'home', 'store'],
    materialsNeeded: ['Mixed coins', 'Counting mat'],
    isActive: true,
    totalSteps: 6,
    isCriticalSafety: false,
    communityRelevance: 5,
    employmentRelevance: 5,
  },
  {
    id: 'skill-3',
    name: 'Making a Sandwich',
    domain: 'COOKING_NUTRITION',
    description: 'Prepare a simple sandwich independently',
    taskAnalysisSteps: [
      { stepNumber: 1, description: 'Gather ingredients', supportLevel: 'VERBAL', promptHierarchy: ['VERBAL', 'GESTURAL', 'INDEPENDENT'] },
      { stepNumber: 2, description: 'Get two slices of bread', supportLevel: 'INDEPENDENT', promptHierarchy: ['INDEPENDENT'] },
      { stepNumber: 3, description: 'Apply condiment', supportLevel: 'GESTURAL', promptHierarchy: ['GESTURAL', 'VERBAL', 'INDEPENDENT'] },
      { stepNumber: 4, description: 'Add protein/filling', supportLevel: 'VERBAL', promptHierarchy: ['VERBAL', 'INDEPENDENT'] },
      { stepNumber: 5, description: 'Add toppings', supportLevel: 'INDEPENDENT', promptHierarchy: ['INDEPENDENT'] },
      { stepNumber: 6, description: 'Place top bread', supportLevel: 'INDEPENDENT', promptHierarchy: ['INDEPENDENT'] },
      { stepNumber: 7, description: 'Cut sandwich if desired', supportLevel: 'MODEL', promptHierarchy: ['MODEL', 'VERBAL', 'INDEPENDENT'] },
      { stepNumber: 8, description: 'Clean up workspace', supportLevel: 'VERBAL', promptHierarchy: ['VERBAL', 'INDEPENDENT'] },
    ],
    prerequisiteSkillIds: [],
    ageAppropriateStart: 8,
    ageAppropriateEnd: 18,
    difficultyLevel: 2,
    targetSettings: ['home', 'classroom-kitchen', 'community-kitchen'],
    materialsNeeded: ['Bread', 'Knife', 'Cutting board', 'Fillings'],
    isActive: true,
    totalSteps: 8,
    isCriticalSafety: true,
    communityRelevance: 5,
    employmentRelevance: 3,
  },
  {
    id: 'skill-4',
    name: 'Reading a Bus Schedule',
    domain: 'TRANSPORTATION',
    description: 'Locate bus times and routes on a schedule',
    taskAnalysisSteps: [
      { stepNumber: 1, description: 'Find route number', supportLevel: 'VERBAL', promptHierarchy: ['VERBAL', 'GESTURAL', 'INDEPENDENT'] },
      { stepNumber: 2, description: 'Locate starting stop', supportLevel: 'MODEL', promptHierarchy: ['MODEL', 'VERBAL', 'INDEPENDENT'] },
      { stepNumber: 3, description: 'Find destination stop', supportLevel: 'MODEL', promptHierarchy: ['MODEL', 'VERBAL', 'INDEPENDENT'] },
      { stepNumber: 4, description: 'Read departure time', supportLevel: 'VERBAL', promptHierarchy: ['VERBAL', 'INDEPENDENT'] },
      { stepNumber: 5, description: 'Read arrival time', supportLevel: 'VERBAL', promptHierarchy: ['VERBAL', 'INDEPENDENT'] },
    ],
    prerequisiteSkillIds: [],
    ageAppropriateStart: 12,
    ageAppropriateEnd: 22,
    difficultyLevel: 3,
    targetSettings: ['classroom', 'bus-station', 'online'],
    materialsNeeded: ['Bus schedule', 'Highlighter'],
    isActive: true,
    totalSteps: 5,
    isCriticalSafety: false,
    communityRelevance: 5,
    employmentRelevance: 5,
  },
  {
    id: 'skill-5',
    name: 'Sorting Laundry',
    domain: 'HOUSING_HOME_CARE',
    description: 'Sort laundry by color and fabric type',
    taskAnalysisSteps: [
      { stepNumber: 1, description: 'Get laundry basket', supportLevel: 'INDEPENDENT', promptHierarchy: ['INDEPENDENT'] },
      { stepNumber: 2, description: 'Set up sorting bins', supportLevel: 'VERBAL', promptHierarchy: ['VERBAL', 'GESTURAL', 'INDEPENDENT'] },
      { stepNumber: 3, description: 'Pick up item', supportLevel: 'INDEPENDENT', promptHierarchy: ['INDEPENDENT'] },
      { stepNumber: 4, description: 'Check color', supportLevel: 'VERBAL', promptHierarchy: ['VERBAL', 'INDEPENDENT'] },
      { stepNumber: 5, description: 'Place in correct bin', supportLevel: 'INDEPENDENT', promptHierarchy: ['INDEPENDENT'] },
      { stepNumber: 6, description: 'Repeat for all items', supportLevel: 'INDEPENDENT', promptHierarchy: ['INDEPENDENT'] },
    ],
    prerequisiteSkillIds: [],
    ageAppropriateStart: 10,
    ageAppropriateEnd: 22,
    difficultyLevel: 2,
    targetSettings: ['home', 'laundromat', 'dorm'],
    materialsNeeded: ['Laundry basket', 'Sorting bins'],
    isActive: true,
    totalSteps: 6,
    isCriticalSafety: false,
    communityRelevance: 5,
    employmentRelevance: 3,
  },
];

export default function SkillsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const learnerId = params?.learnerId as string;
  const initialDomain = searchParams?.get('domain') || undefined;

  const [selectedSkill, setSelectedSkill] = useState<typeof mockSkills[0] | null>(null);
  const [showAddSkill, setShowAddSkill] = useState(false);

  const basePath = `/teacher/learners/${learnerId}/independent-living`;

  const handleSkillSelect = (skillId: string) => {
    const skill = mockSkills.find((s) => s.id === skillId);
    setSelectedSkill(skill || null);
  };

  const handleAssignSkill = (skillId: string) => {
    // TODO: Implement skill assignment to learner
    console.log('Assign skill:', skillId);
    alert(`Skill ${skillId} assigned to learner. (Demo)`);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={basePath}
            className="p-2 hover:bg-muted rounded-md"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Skills Catalog</h1>
            <p className="text-muted-foreground">
              Browse and assign functional living skills
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddSkill(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Custom Skill
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Skill Browser */}
        <div className="lg:col-span-2">
          <ILSSkillBrowser
            skills={mockSkills}
            onSkillSelect={handleSkillSelect}
            selectedSkillId={selectedSkill?.id}
          />
        </div>

        {/* Skill Detail / Task Analysis */}
        <div className="lg:col-span-1">
          {selectedSkill ? (
            <div className="space-y-4 sticky top-6">
              <Card>
                <CardHeader>
                  <h3 className="font-semibold">{selectedSkill.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedSkill.description}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge>Difficulty: {selectedSkill.difficultyLevel}/5</Badge>
                    <Badge variant="outline">
                      Ages {selectedSkill.ageAppropriateStart}-{selectedSkill.ageAppropriateEnd}
                    </Badge>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">Target Settings</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedSkill.targetSettings.map((setting) => (
                        <Badge key={setting} variant="outline" className="text-xs">
                          {setting}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Materials Needed</h4>
                    <ul className="text-sm text-muted-foreground list-disc list-inside">
                      {selectedSkill.materialsNeeded.map((material, i) => (
                        <li key={i}>{material}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <TaskAnalysisViewer
                skillName={selectedSkill.name}
                skillDescription={selectedSkill.description}
                steps={selectedSkill.taskAnalysisSteps.map((step) => ({
                  stepNumber: step.stepNumber,
                  description: step.description,
                  promptHierarchy: step.promptHierarchy,
                }))}
              />
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a skill to view details and task analysis</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
