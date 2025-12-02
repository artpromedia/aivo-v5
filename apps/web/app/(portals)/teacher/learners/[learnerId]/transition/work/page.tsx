'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';

/**
 * Work Experience Page
 * Job shadows, internships, paid work experience
 */

type ExperienceType = 'job-shadow' | 'internship' | 'work-experience';
type ExperienceStatus = 'planned' | 'in-progress' | 'completed';

interface WorkExperience {
  id: string;
  type: ExperienceType;
  employer: string;
  position: string;
  startDate: string;
  endDate?: string;
  hoursCompleted: number;
  hoursPlanned: number;
  status: ExperienceStatus;
  supervisorName: string;
  supervisorEmail?: string;
  skills: string[];
  notes?: string;
  isPaid: boolean;
  hourlyRate?: number;
}

// Mock data
const mockExperiences: WorkExperience[] = [
  {
    id: 'exp1',
    type: 'job-shadow',
    employer: 'Johnson Auto Repair',
    position: 'Auto Technician Shadow',
    startDate: '2024-03-15',
    endDate: '2024-03-15',
    hoursCompleted: 4,
    hoursPlanned: 4,
    status: 'completed',
    supervisorName: 'Mike Johnson',
    skills: ['Vehicle inspection', 'Tool identification', 'Shop safety'],
    notes: 'Excellent experience. Student showed strong interest and aptitude.',
    isPaid: false,
  },
  {
    id: 'exp2',
    type: 'internship',
    employer: 'City Auto Center',
    position: 'Automotive Intern',
    startDate: '2024-06-01',
    hoursCompleted: 0,
    hoursPlanned: 100,
    status: 'planned',
    supervisorName: 'Sarah Williams',
    supervisorEmail: 'swilliams@cityauto.com',
    skills: [],
    isPaid: true,
    hourlyRate: 12.50,
  },
];

const mockPartners = [
  { id: 'p1', name: 'Johnson Auto Repair', industry: 'Automotive', contact: 'Mike Johnson', acceptsStudents: true },
  { id: 'p2', name: 'City Auto Center', industry: 'Automotive', contact: 'Sarah Williams', acceptsStudents: true },
  { id: 'p3', name: 'Metro Hospital', industry: 'Healthcare', contact: 'Dr. Smith', acceptsStudents: true },
  { id: 'p4', name: 'Tech Solutions Inc', industry: 'IT', contact: 'John Doe', acceptsStudents: false },
];

const typeConfig: Record<ExperienceType, { label: string; icon: string; color: string }> = {
  'job-shadow': { label: 'Job Shadow', icon: '👁️', color: 'bg-blue-100 text-blue-700' },
  'internship': { label: 'Internship', icon: '📋', color: 'bg-theme-primary/10 text-theme-primary' },
  'work-experience': { label: 'Work Experience', icon: '💼', color: 'bg-green-100 text-green-700' },
};

const statusConfig: Record<ExperienceStatus, { label: string; color: string }> = {
  planned: { label: 'Planned', color: 'bg-gray-100 text-gray-700' },
  'in-progress': { label: 'In Progress', color: 'bg-yellow-100 text-yellow-700' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700' },
};

export default function WorkExperiencePage() {
  const params = useParams();
  const [activeTab, setActiveTab] = useState<'experiences' | 'partners' | 'log'>('experiences');
  const [typeFilter, setTypeFilter] = useState<ExperienceType | 'all'>('all');

  const filteredExperiences = mockExperiences.filter(
    (exp) => typeFilter === 'all' || exp.type === typeFilter
  );

  const totalHoursCompleted = mockExperiences.reduce((sum, exp) => sum + exp.hoursCompleted, 0);
  const totalHoursPlanned = mockExperiences.reduce((sum, exp) => sum + exp.hoursPlanned, 0);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <nav className="text-sm text-gray-500 mb-2">
            <a href="../transition" className="hover:text-indigo-600">Transition</a>
            <span className="mx-2">/</span>
            <span className="text-gray-900">Work Experience</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900">Work-Based Learning</h1>
          <p className="text-gray-600">Job shadows, internships, and employment experiences</p>
        </div>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          + Add Experience
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Total Hours</div>
            <div className="text-2xl font-bold">{totalHoursCompleted}/{totalHoursPlanned}</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-green-500 h-2 rounded-full" 
                style={{ width: `${Math.min(100, (totalHoursCompleted / totalHoursPlanned) * 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Job Shadows</div>
            <div className="text-2xl font-bold">{mockExperiences.filter(e => e.type === 'job-shadow').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Internships</div>
            <div className="text-2xl font-bold">{mockExperiences.filter(e => e.type === 'internship').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Employer Partners</div>
            <div className="text-2xl font-bold">{mockPartners.filter(p => p.acceptsStudents).length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {[
            { id: 'experiences', label: 'Experiences', icon: '📝' },
            { id: 'partners', label: 'Employer Partners', icon: '🏢' },
            { id: 'log', label: 'Hour Log', icon: '⏱️' },
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

      {/* Experiences Tab */}
      {activeTab === 'experiences' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-2">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1 rounded-full text-sm ${
                typeFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-100'
              }`}
            >
              All
            </button>
            {(Object.keys(typeConfig) as ExperienceType[]).map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${
                  typeFilter === type ? 'bg-indigo-600 text-white' : 'bg-gray-100'
                }`}
              >
                <span>{typeConfig[type].icon}</span>
                {typeConfig[type].label}
              </button>
            ))}
          </div>

          {/* Experience Cards */}
          {filteredExperiences.map((exp) => (
            <Card key={exp.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2 py-1 rounded text-sm ${typeConfig[exp.type].color}`}>
                        {typeConfig[exp.type].icon} {typeConfig[exp.type].label}
                      </span>
                      <span className={`px-2 py-1 rounded text-sm ${statusConfig[exp.status].color}`}>
                        {statusConfig[exp.status].label}
                      </span>
                      {exp.isPaid && (
                        <span className="px-2 py-1 rounded text-sm bg-green-100 text-green-700">
                          💵 ${exp.hourlyRate}/hr
                        </span>
                      )}
                    </div>
                    
                    <h3 className="font-semibold text-lg">{exp.position}</h3>
                    <p className="text-gray-600">{exp.employer}</p>
                    
                    <div className="flex gap-4 mt-2 text-sm text-gray-500">
                      <span>📅 {exp.startDate}{exp.endDate ? ` - ${exp.endDate}` : ''}</span>
                      <span>👤 Supervisor: {exp.supervisorName}</span>
                    </div>

                    {exp.skills.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-500 mb-1">Skills Developed:</p>
                        <div className="flex flex-wrap gap-2">
                          {exp.skills.map((skill, i) => (
                            <span key={i} className="px-2 py-1 bg-gray-100 rounded text-xs">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {exp.notes && (
                      <p className="mt-3 text-sm text-gray-600 italic">"{exp.notes}"</p>
                    )}
                  </div>

                  <div className="ml-4 text-right">
                    <div className="text-2xl font-bold text-indigo-600">
                      {exp.hoursCompleted}
                    </div>
                    <div className="text-sm text-gray-500">
                      of {exp.hoursPlanned} hours
                    </div>
                    <div className="w-24 bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-indigo-500 h-2 rounded-full" 
                        style={{ width: `${Math.min(100, (exp.hoursCompleted / exp.hoursPlanned) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Partners Tab */}
      {activeTab === 'partners' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Employer Partners</h2>
            <button className="px-4 py-2 border rounded-lg hover:bg-gray-50">
              + Add Partner
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {mockPartners.map((partner) => (
              <Card key={partner.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{partner.name}</h3>
                      <p className="text-sm text-gray-600">{partner.industry}</p>
                      <p className="text-sm text-gray-500 mt-1">Contact: {partner.contact}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      partner.acceptsStudents 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {partner.acceptsStudents ? '✓ Accepting Students' : 'Not Accepting'}
                    </span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button className="px-3 py-1 bg-indigo-600 text-white rounded text-sm">
                      Schedule Visit
                    </button>
                    <button className="px-3 py-1 border rounded text-sm">
                      View Details
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Hour Log Tab */}
      {activeTab === 'log' && (
        <div className="space-y-4">
          <Card>
            <CardHeader title="Work Hour Log" subtitle="Track and verify work experience hours" />
            <CardContent>
              <table className="w-full">
                <thead className="text-left border-b">
                  <tr>
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Employer</th>
                    <th className="pb-2 font-medium">Hours</th>
                    <th className="pb-2 font-medium">Tasks</th>
                    <th className="pb-2 font-medium">Verified</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b">
                    <td className="py-3">2024-03-15</td>
                    <td>Johnson Auto Repair</td>
                    <td>4 hrs</td>
                    <td>Observed vehicle inspections, learned shop safety</td>
                    <td><span className="text-green-600">✓</span></td>
                  </tr>
                </tbody>
              </table>
              
              <button className="mt-4 px-4 py-2 border border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-indigo-400 hover:text-indigo-600 w-full">
                + Log New Hours
              </button>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader title="Hours Summary by Type" />
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {(Object.keys(typeConfig) as ExperienceType[]).map((type) => {
                  const typeExps = mockExperiences.filter(e => e.type === type);
                  const hours = typeExps.reduce((sum, e) => sum + e.hoursCompleted, 0);
                  return (
                    <div key={type} className="text-center p-4 bg-gray-50 rounded-lg">
                      <span className="text-2xl">{typeConfig[type].icon}</span>
                      <div className="text-2xl font-bold mt-2">{hours}</div>
                      <div className="text-sm text-gray-500">{typeConfig[type].label} Hours</div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
