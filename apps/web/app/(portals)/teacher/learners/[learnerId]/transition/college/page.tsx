'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { CollegeSearchFilters, type CollegeFilters } from '@/components/transition';

/**
 * College Prep Page
 * Search colleges, track applications, manage accommodation requests
 */

interface College {
  id: string;
  name: string;
  city: string;
  state: string;
  type: string;
  size: string;
  programsOfInterest: string[];
  hasDisabilityServices: boolean;
  acceptanceRate: number;
  tuition: number;
  distance: number;
}

interface Application {
  id: string;
  collegeId: string;
  collegeName: string;
  status: 'researching' | 'applied' | 'accepted' | 'denied' | 'enrolled' | 'withdrawn';
  deadline?: string;
  submittedDate?: string;
  accommodationsRequested: boolean;
}

// Mock colleges data
const mockColleges: College[] = [
  {
    id: 'c1',
    name: 'Metro Community College',
    city: 'Springfield',
    state: 'IL',
    type: 'community',
    size: 'medium',
    programsOfInterest: ['Automotive Technology', 'Welding', 'HVAC'],
    hasDisabilityServices: true,
    acceptanceRate: 100,
    tuition: 4500,
    distance: 15,
  },
  {
    id: 'c2',
    name: 'State Technical College',
    city: 'Capital City',
    state: 'IL',
    type: 'technical',
    size: 'small',
    programsOfInterest: ['Automotive Technology', 'Diesel Mechanics', 'Collision Repair'],
    hasDisabilityServices: true,
    acceptanceRate: 85,
    tuition: 6200,
    distance: 45,
  },
  {
    id: 'c3',
    name: 'Regional University',
    city: 'University Park',
    state: 'IL',
    type: 'public',
    size: 'large',
    programsOfInterest: ['Engineering Technology', 'Industrial Technology'],
    hasDisabilityServices: true,
    acceptanceRate: 65,
    tuition: 12000,
    distance: 80,
  },
];

const mockApplications: Application[] = [
  {
    id: 'app1',
    collegeId: 'c1',
    collegeName: 'Metro Community College',
    status: 'accepted',
    deadline: '2024-03-15',
    submittedDate: '2024-02-20',
    accommodationsRequested: true,
  },
  {
    id: 'app2',
    collegeId: 'c2',
    collegeName: 'State Technical College',
    status: 'applied',
    deadline: '2024-04-01',
    submittedDate: '2024-03-10',
    accommodationsRequested: true,
  },
];

const statusColors: Record<string, { bg: string; text: string }> = {
  researching: { bg: 'bg-gray-100', text: 'text-gray-700' },
  applied: { bg: 'bg-blue-100', text: 'text-blue-700' },
  accepted: { bg: 'bg-green-100', text: 'text-green-700' },
  denied: { bg: 'bg-red-100', text: 'text-red-700' },
  enrolled: { bg: 'bg-purple-100', text: 'text-purple-700' },
  withdrawn: { bg: 'bg-gray-100', text: 'text-gray-500' },
};

export default function CollegePrepPage() {
  const params = useParams();
  const [activeTab, setActiveTab] = useState<'search' | 'applications' | 'accommodations'>('search');
  const [filters, setFilters] = useState<CollegeFilters>({
    state: '',
    collegeType: '',
    hasDisabilityServices: false,
    minDisabilityRating: null,
    maxTuition: null,
    minAcceptanceRate: null,
    programs: [],
  });
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);

  const filteredColleges = mockColleges.filter((college) => {
    if (filters.collegeType && college.type !== filters.collegeType) return false;
    if (filters.maxTuition && college.tuition > filters.maxTuition) return false;
    if (filters.hasDisabilityServices && !college.hasDisabilityServices) return false;
    if (filters.programs.length > 0 && !college.programsOfInterest.some(p => 
      filters.programs.some(fp => p.toLowerCase().includes(fp.toLowerCase()))
    )) return false;
    return true;
  });

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <nav className="text-sm text-gray-500 mb-2">
            <a href="../transition" className="hover:text-indigo-600">Transition</a>
            <span className="mx-2">/</span>
            <span className="text-gray-900">College Prep</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900">College Prep</h1>
          <p className="text-gray-600">Search colleges, track applications, request accommodations</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {[
            { id: 'search', label: 'College Search', icon: '🔍' },
            { id: 'applications', label: 'Applications', icon: '📝' },
            { id: 'accommodations', label: 'Accommodations', icon: '♿' },
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

      {/* Search Tab */}
      {activeTab === 'search' && (
        <div className="space-y-6">
          <CollegeSearchFilters
            initialFilters={filters}
            onFilterChange={setFilters}
          />

          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Found {filteredColleges.length} colleges matching your criteria
            </p>

            {filteredColleges.map((college) => (
              <Card key={college.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{college.name}</h3>
                        {college.hasDisabilityServices && (
                          <span className="text-purple-600" title="Disability Services Available">♿</span>
                        )}
                      </div>
                      <p className="text-gray-600">{college.city}, {college.state} • {college.distance} miles away</p>
                      
                      <div className="flex gap-4 mt-2 text-sm">
                        <span className="capitalize">{college.type}</span>
                        <span>•</span>
                        <span className="capitalize">{college.size} size</span>
                        <span>•</span>
                        <span>{college.acceptanceRate}% acceptance rate</span>
                        <span>•</span>
                        <span>${college.tuition.toLocaleString()}/year</span>
                      </div>

                      <div className="mt-3">
                        <p className="text-xs text-gray-500 mb-1">Programs of Interest:</p>
                        <div className="flex flex-wrap gap-2">
                          {college.programsOfInterest.map((prog, i) => (
                            <span key={i} className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs">
                              {prog}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <button className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm">
                        Add to List
                      </button>
                      <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm">
                        View Details
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Applications Tab */}
      {activeTab === 'applications' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">College Applications</h2>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
              + Add Application
            </button>
          </div>

          {mockApplications.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <span className="text-4xl block mb-4">📝</span>
                <h3 className="font-semibold text-lg mb-2">No applications yet</h3>
                <p className="text-gray-600 mb-4">Start tracking college applications to stay organized</p>
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg">
                  Add First Application
                </button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {mockApplications.map((app) => (
                <Card key={app.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold">{app.collegeName}</h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                          {app.deadline && <span>Deadline: {app.deadline}</span>}
                          {app.submittedDate && <span>Submitted: {app.submittedDate}</span>}
                          {app.accommodationsRequested && (
                            <span className="text-purple-600">♿ Accommodations Requested</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-sm capitalize ${statusColors[app.status].bg} ${statusColors[app.status].text}`}>
                          {app.status}
                        </span>
                        <button className="px-3 py-1 border rounded hover:bg-gray-50 text-sm">
                          Edit
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Application Progress Summary */}
          <Card>
            <CardHeader title="Application Progress" />
            <CardContent>
              <div className="grid grid-cols-6 gap-4 text-center">
                {['researching', 'applied', 'accepted', 'denied', 'enrolled', 'withdrawn'].map((status) => {
                  const count = mockApplications.filter(a => a.status === status).length;
                  return (
                    <div key={status} className="p-3 rounded-lg bg-gray-50">
                      <div className="text-2xl font-bold">{count}</div>
                      <div className="text-xs text-gray-500 capitalize">{status}</div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Accommodations Tab */}
      {activeTab === 'accommodations' && (
        <div className="space-y-6">
          <Card>
            <CardHeader 
              title="College Accommodation Requests" 
              subtitle="Documentation needed for disability services offices"
            />
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-2">📋 Required Documentation</h4>
                  <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                    <li>Current IEP or 504 Plan</li>
                    <li>Psychoeducational evaluation (within 3 years)</li>
                    <li>High school transcript with accommodation history</li>
                    <li>Summary of Performance (SOP)</li>
                    <li>Self-advocacy documentation</li>
                  </ul>
                </div>

                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Important Notes</h4>
                  <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                    <li>High school IEPs don't automatically transfer to college</li>
                    <li>Students must self-identify and request accommodations</li>
                    <li>Contact disability services BEFORE enrollment</li>
                    <li>Timeline: Start process 6+ months before enrollment</li>
                  </ul>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-6">
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-3">Current High School Accommodations</h4>
                      <div className="space-y-2">
                        {[
                          'Extended time (1.5x) on tests',
                          'Preferential seating',
                          'Reduced distraction testing environment',
                          'Notes/study guides provided',
                          'Calculator use permitted',
                        ].map((acc, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <span className="text-green-600">✓</span>
                            {acc}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-3">Recommended College Accommodations</h4>
                      <div className="space-y-2">
                        {[
                          'Extended time on exams',
                          'Distraction-reduced testing room',
                          'Note-taking services',
                          'Priority registration',
                          'Audio recording of lectures',
                        ].map((acc, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <span className="text-blue-600">→</span>
                            {acc}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <button className="w-full mt-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                  Generate Accommodation Letter
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
