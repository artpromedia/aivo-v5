'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';

interface PersonCenteredPlan {
  dreams: string[];
  nightmares: string[];
  importantTo: string[];
  importantFor: string[];
  strengths: string[];
  gifts: string[];
  talents: string[];
  interests: string[];
  supportNeeds?: Record<string, string>;
  importantPeople?: Array<{ name: string; relationship: string; role: string }>;
  actionItems?: Array<{ action: string; responsible: string; deadline: string; status: string }>;
}

interface PersonCenteredPlanBuilderProps {
  plan: PersonCenteredPlan;
  onPlanUpdate: (plan: PersonCenteredPlan) => void;
  learnerName: string;
  isReadOnly?: boolean;
}

type PlanSection = keyof Pick<PersonCenteredPlan, 'dreams' | 'nightmares' | 'importantTo' | 'importantFor' | 'strengths' | 'gifts' | 'talents' | 'interests'>;

const SECTION_CONFIG: Record<PlanSection, { title: string; icon: string; color: string; prompt: string }> = {
  dreams: {
    title: 'Dreams & Aspirations',
    icon: '✨',
    color: 'bg-theme-primary/10 border-theme-primary/30 text-theme-primary',
    prompt: "What does the student dream of for their future? What are their hopes?",
  },
  nightmares: {
    title: 'Fears & Concerns',
    icon: '😰',
    color: 'bg-red-100 border-red-300 text-red-800',
    prompt: "What does the student want to avoid? What worries them about the future?",
  },
  importantTo: {
    title: 'Important TO Me',
    icon: '❤️',
    color: 'bg-pink-100 border-pink-300 text-pink-800',
    prompt: "What matters TO the student? (preferences, wishes, what makes them happy)",
  },
  importantFor: {
    title: 'Important FOR Me',
    icon: '🛡️',
    color: 'bg-blue-100 border-blue-300 text-blue-800',
    prompt: "What matters FOR the student? (health, safety, well-being needs)",
  },
  strengths: {
    title: 'Strengths',
    icon: '💪',
    color: 'bg-green-100 border-green-300 text-green-800',
    prompt: "What is the student good at? What do they do well?",
  },
  gifts: {
    title: 'Gifts & Contributions',
    icon: '🎁',
    color: 'bg-amber-100 border-amber-300 text-amber-800',
    prompt: "What unique gifts does the student bring? How do they contribute to others?",
  },
  talents: {
    title: 'Talents & Skills',
    icon: '⭐',
    color: 'bg-indigo-100 border-indigo-300 text-indigo-800',
    prompt: "What talents and skills does the student have?",
  },
  interests: {
    title: 'Interests & Hobbies',
    icon: '🎯',
    color: 'bg-cyan-100 border-cyan-300 text-cyan-800',
    prompt: "What does the student enjoy doing? What are their hobbies?",
  },
};

export function PersonCenteredPlanBuilder({
  plan,
  onPlanUpdate,
  learnerName,
  isReadOnly = false,
}: PersonCenteredPlanBuilderProps) {
  const [activeSection, setActiveSection] = useState<PlanSection | null>(null);
  const [newItem, setNewItem] = useState('');
  const [newPerson, setNewPerson] = useState({ name: '', relationship: '', role: '' });
  const [newAction, setNewAction] = useState({ action: '', responsible: '', deadline: '', status: 'pending' });

  const addItem = (section: PlanSection) => {
    if (!newItem.trim()) return;
    const updatedPlan = {
      ...plan,
      [section]: [...plan[section], newItem.trim()],
    };
    onPlanUpdate(updatedPlan);
    setNewItem('');
  };

  const removeItem = (section: PlanSection, index: number) => {
    const updatedPlan = {
      ...plan,
      [section]: plan[section].filter((_, i) => i !== index),
    };
    onPlanUpdate(updatedPlan);
  };

  const addPerson = () => {
    if (!newPerson.name.trim()) return;
    const updatedPlan = {
      ...plan,
      importantPeople: [...(plan.importantPeople || []), newPerson],
    };
    onPlanUpdate(updatedPlan);
    setNewPerson({ name: '', relationship: '', role: '' });
  };

  const addAction = () => {
    if (!newAction.action.trim()) return;
    const updatedPlan = {
      ...plan,
      actionItems: [...(plan.actionItems || []), newAction],
    };
    onPlanUpdate(updatedPlan);
    setNewAction({ action: '', responsible: '', deadline: '', status: 'pending' });
  };

  const sections = Object.keys(SECTION_CONFIG) as PlanSection[];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-indigo-500 to-theme-primary text-white">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold">{learnerName}'s Person-Centered Plan</h2>
          <p className="opacity-90 mt-2">
            A person-centered plan focuses on what matters most to you and builds a life you want.
          </p>
        </CardContent>
      </Card>

      {/* Main Sections Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {sections.map((section) => {
          const config = SECTION_CONFIG[section];
          const items = plan[section];
          const isActive = activeSection === section;

          return (
            <div
              key={section}
              className="cursor-pointer"
              onClick={() => setActiveSection(isActive ? null : section)}
            >
              <Card className={`transition-all h-full ${isActive ? 'ring-2 ring-indigo-500' : ''}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{config.icon}</span>
                    <h3 className="font-semibold">{config.title}</h3>
                  </div>
                  <span className="text-sm text-gray-500">{items.length} items</span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">{config.prompt}</p>
                
                {/* Items list */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {items.map((item, i) => (
                    <span
                      key={i}
                      className={`px-3 py-1 rounded-full text-sm border ${config.color} flex items-center gap-1`}
                    >
                      {item}
                      {!isReadOnly && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeItem(section, i);
                          }}
                          className="ml-1 hover:text-red-600"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                </div>

                {/* Add new item */}
                {isActive && !isReadOnly && (
                  <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={newItem}
                      onChange={(e) => setNewItem(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addItem(section)}
                      placeholder={`Add to ${config.title.toLowerCase()}...`}
                      className="flex-1 px-3 py-2 border rounded text-sm"
                    />
                    <button
                      onClick={() => addItem(section)}
                      className="px-4 py-2 bg-indigo-500 text-white rounded text-sm hover:bg-indigo-600"
                    >
                      Add
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
            </div>
          );
        })}
      </div>

      {/* Important People */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <span className="text-2xl">👥</span>
            <h3 className="font-semibold">Support Circle</h3>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Who are the important people in the student's life? What role do they play?
          </p>

          {/* People list */}
          <div className="space-y-3 mb-4">
            {(plan.importantPeople || []).map((person, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <span className="font-medium">{person.name}</span>
                  <span className="text-gray-500"> - {person.relationship}</span>
                  <p className="text-sm text-gray-600">{person.role}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Add person form */}
          {!isReadOnly && (
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                value={newPerson.name}
                onChange={(e) => setNewPerson({ ...newPerson, name: e.target.value })}
                placeholder="Name"
                className="px-3 py-2 border rounded text-sm"
              />
              <input
                type="text"
                value={newPerson.relationship}
                onChange={(e) => setNewPerson({ ...newPerson, relationship: e.target.value })}
                placeholder="Relationship"
                className="px-3 py-2 border rounded text-sm"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPerson.role}
                  onChange={(e) => setNewPerson({ ...newPerson, role: e.target.value })}
                  placeholder="Support role"
                  className="flex-1 px-3 py-2 border rounded text-sm"
                />
                <button
                  onClick={addPerson}
                  className="px-4 py-2 bg-indigo-500 text-white rounded text-sm hover:bg-indigo-600"
                >
                  Add
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <span className="text-2xl">✅</span>
            <h3 className="font-semibold">Action Items</h3>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            What specific actions will help achieve these dreams and goals?
          </p>

          {/* Actions list */}
          <div className="space-y-2 mb-4">
            {(plan.actionItems || []).map((item, i) => (
              <div
                key={i}
                className={`flex items-center justify-between p-3 rounded border ${
                  item.status === 'completed'
                    ? 'bg-green-50 border-green-200'
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex-1">
                  <p className={item.status === 'completed' ? 'line-through text-gray-500' : ''}>
                    {item.action}
                  </p>
                  <p className="text-sm text-gray-500">
                    {item.responsible} • Due: {item.deadline}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    item.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : item.status === 'in-progress'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>

          {/* Add action form */}
          {!isReadOnly && (
            <div className="grid grid-cols-4 gap-2">
              <input
                type="text"
                value={newAction.action}
                onChange={(e) => setNewAction({ ...newAction, action: e.target.value })}
                placeholder="Action item"
                className="col-span-2 px-3 py-2 border rounded text-sm"
              />
              <input
                type="text"
                value={newAction.responsible}
                onChange={(e) => setNewAction({ ...newAction, responsible: e.target.value })}
                placeholder="Who's responsible"
                className="px-3 py-2 border rounded text-sm"
              />
              <div className="flex gap-2">
                <input
                  type="date"
                  value={newAction.deadline}
                  onChange={(e) => setNewAction({ ...newAction, deadline: e.target.value })}
                  className="flex-1 px-3 py-2 border rounded text-sm"
                />
                <button
                  onClick={addAction}
                  className="px-4 py-2 bg-indigo-500 text-white rounded text-sm hover:bg-indigo-600"
                >
                  Add
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary View */}
      <Card className="bg-gray-50">
        <CardHeader>
          <h3 className="font-semibold">Plan Summary</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-theme-primary">{plan.dreams.length}</p>
              <p className="text-sm text-gray-600">Dreams</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{plan.strengths.length}</p>
              <p className="text-sm text-gray-600">Strengths</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{(plan.importantPeople || []).length}</p>
              <p className="text-sm text-gray-600">Support People</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">{(plan.actionItems || []).length}</p>
              <p className="text-sm text-gray-600">Action Items</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PersonCenteredPlanBuilder;
