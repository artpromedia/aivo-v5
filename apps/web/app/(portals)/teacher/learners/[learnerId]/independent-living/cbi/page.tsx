'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CBIPlanner } from '@/components/ils';
import { ArrowLeft, Plus, Calendar, MapPin, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

/**
 * Community-Based Instruction (CBI) Page
 * Plan and track community training sessions
 */

// Mock CBI sessions - replace with API calls
const mockCBISessions = [
  {
    id: 'cbi-1',
    location: 'Local Grocery Store',
    locationAddress: '123 Main St',
    scheduledDate: '2024-05-20',
    scheduledTime: '10:00 AM',
    duration: '90 minutes',
    status: 'scheduled' as const,
    skillsFocus: ['Making Change', 'Using Shopping List', 'Reading Price Tags'],
    objectives: [
      'Complete a 5-item shopping list independently',
      'Pay with cash and count change',
      'Navigate store using aisle signs',
    ],
    transportationPlan: 'School van with aide',
    staffAssigned: ['Ms. Johnson', 'Mr. Smith'],
    parentConsent: true,
    notes: 'First CBI to grocery store this semester',
  },
  {
    id: 'cbi-2',
    location: 'City Bus Station',
    locationAddress: '456 Transit Center',
    scheduledDate: '2024-05-22',
    scheduledTime: '1:00 PM',
    duration: '120 minutes',
    status: 'scheduled' as const,
    skillsFocus: ['Reading Bus Schedule', 'Purchasing Ticket', 'Waiting Safely'],
    objectives: [
      'Read schedule to find correct bus',
      'Purchase ticket using kiosk',
      'Practice safety while waiting',
    ],
    transportationPlan: 'Walking from school',
    staffAssigned: ['Ms. Johnson'],
    parentConsent: true,
    notes: 'Practice route to community college',
  },
  {
    id: 'cbi-3',
    location: 'Downtown Library',
    locationAddress: '789 Library Way',
    scheduledDate: '2024-05-15',
    scheduledTime: '2:00 PM',
    duration: '60 minutes',
    status: 'completed' as const,
    skillsFocus: ['Getting Library Card', 'Using Self-Checkout', 'Finding Books'],
    objectives: [
      'Apply for library card independently',
      'Use computer catalog to find book',
      'Check out book using self-service',
    ],
    transportationPlan: 'School van',
    staffAssigned: ['Mr. Williams'],
    parentConsent: true,
    completedOutcomes: {
      successRating: 4,
      objectivesAchieved: ['Apply for library card independently', 'Check out book using self-service'],
      challengesNoted: ['Needed help with computer catalog'],
      nextSteps: ['Practice computer catalog in classroom first'],
    },
    notes: 'Great progress! Student very engaged.',
  },
  {
    id: 'cbi-4',
    location: 'Fast Food Restaurant',
    locationAddress: '321 Food Court',
    scheduledDate: '2024-05-10',
    scheduledTime: '11:30 AM',
    duration: '45 minutes',
    status: 'completed' as const,
    skillsFocus: ['Ordering Food', 'Paying at Counter', 'Finding Seat'],
    objectives: [
      'Order meal from menu independently',
      'Pay and count change',
      'Find seat and clean up after',
    ],
    transportationPlan: 'Walking',
    staffAssigned: ['Ms. Johnson'],
    parentConsent: true,
    completedOutcomes: {
      successRating: 5,
      objectivesAchieved: ['Order meal from menu independently', 'Pay and count change', 'Find seat and clean up after'],
      challengesNoted: [],
      nextSteps: ['Try different restaurant next time'],
    },
    notes: 'Excellent! All objectives met.',
  },
];

const statusColors = {
  scheduled: 'bg-blue-100 text-blue-800',
  'in-progress': 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

const statusIcons = {
  scheduled: Calendar,
  'in-progress': Clock,
  completed: CheckCircle2,
  cancelled: AlertCircle,
};

export default function CBIPage() {
  const params = useParams();
  const learnerId = params?.learnerId as string;
  const [showPlanner, setShowPlanner] = useState(false);
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'completed'>('all');

  const basePath = `/teacher/learners/${learnerId}/independent-living`;

  const filteredSessions = mockCBISessions.filter((session) => {
    if (filter === 'all') return true;
    return session.status === filter;
  });

  const handleCreateSession = (data: {
    scheduledDate: string;
    startTime?: string;
    endTime?: string;
    locationName: string;
    locationAddress?: string;
    settingType: string;
    instructorName: string;
    staffRatio?: string;
    additionalStaff: string[];
    transportationType?: string;
    transportationNotes?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
    medicalNotes?: string;
    preTeachingNotes?: string;
    activities: Array<{
      id?: string;
      skillId: string;
      skillName: string;
      activityName: string;
      activityDescription?: string;
      orderInSession: number;
      targetSteps: number[];
      targetPromptLevel: string;
    }>;
  }) => {
    console.log('Create CBI session:', data);
    alert('CBI session created! (Demo)');
    setShowPlanner(false);
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
            <h1 className="text-2xl font-bold">Community-Based Instruction</h1>
            <p className="text-muted-foreground">
              Plan and track real-world skill practice sessions
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowPlanner(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Plan Session
        </button>
      </div>

      {/* Planner Modal */}
      {showPlanner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <CBIPlanner
                availableSkills={[
                  { id: 's1', name: 'Making Change', domain: 'MONEY_MANAGEMENT', totalSteps: 5 },
                  { id: 's2', name: 'Using Shopping List', domain: 'MONEY_MANAGEMENT', totalSteps: 6 },
                  { id: 's3', name: 'Reading Price Tags', domain: 'MONEY_MANAGEMENT', totalSteps: 4 },
                  { id: 's4', name: 'Reading Bus Schedule', domain: 'TRANSPORTATION', totalSteps: 5 },
                  { id: 's5', name: 'Purchasing Ticket', domain: 'TRANSPORTATION', totalSteps: 6 },
                  { id: 's6', name: 'Waiting Safely', domain: 'TRANSPORTATION', totalSteps: 4 },
                  { id: 's7', name: 'Ordering Food', domain: 'COOKING_NUTRITION', totalSteps: 5 },
                  { id: 's8', name: 'Paying at Counter', domain: 'MONEY_MANAGEMENT', totalSteps: 4 },
                  { id: 's9', name: 'Getting Library Card', domain: 'COMMUNITY_RESOURCES', totalSteps: 6 },
                ]}
                onSave={handleCreateSession}
              />
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b pb-2">
        {(['all', 'scheduled', 'completed'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-t-md text-sm capitalize ${
              filter === tab
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
          >
            {tab} ({mockCBISessions.filter((s) => tab === 'all' || s.status === tab).length})
          </button>
        ))}
      </div>

      {/* Sessions List */}
      <div className="space-y-4">
        {filteredSessions.map((session) => {
          const StatusIcon = statusIcons[session.status];

          return (
            <Card key={session.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-semibold">{session.location}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{session.locationAddress}</p>
                  </div>
                  <Badge className={statusColors[session.status]}>
                    <StatusIcon className="h-3.5 w-3.5 mr-1" />
                    {session.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Schedule Info */}
                <div className="flex flex-wrap gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {session.scheduledDate} at {session.scheduledTime}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    {session.duration}
                  </span>
                </div>

                {/* Skills Focus */}
                <div>
                  <p className="text-sm font-medium mb-2">Skills Focus:</p>
                  <div className="flex flex-wrap gap-1">
                    {session.skillsFocus.map((skill) => (
                      <Badge key={skill} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Objectives */}
                <div>
                  <p className="text-sm font-medium mb-2">Objectives:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {session.objectives.map((obj, i) => (
                      <li key={i} className="flex items-start gap-2">
                        {session.status === 'completed' &&
                        session.completedOutcomes?.objectivesAchieved.includes(obj) ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                        ) : (
                          <span className="text-muted-foreground">•</span>
                        )}
                        {obj}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Completed Outcomes */}
                {session.status === 'completed' && session.completedOutcomes && (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm font-medium mb-2">
                      Session Rating: {session.completedOutcomes.successRating}/5 ⭐
                    </p>
                    {session.completedOutcomes.challengesNoted.length > 0 && (
                      <div className="mb-2">
                        <p className="text-sm font-medium">Challenges:</p>
                        <ul className="text-sm text-muted-foreground">
                          {session.completedOutcomes.challengesNoted.map((c, i) => (
                            <li key={i}>• {c}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {session.completedOutcomes.nextSteps.length > 0 && (
                      <div>
                        <p className="text-sm font-medium">Next Steps:</p>
                        <ul className="text-sm text-muted-foreground">
                          {session.completedOutcomes.nextSteps.map((s, i) => (
                            <li key={i}>• {s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Staff & Transportation */}
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground pt-2 border-t">
                  <span>Staff: {session.staffAssigned.join(', ')}</span>
                  <span>Transport: {session.transportationPlan}</span>
                  {session.parentConsent && (
                    <span className="text-green-600">✓ Parent Consent</span>
                  )}
                </div>

                {/* Notes */}
                {session.notes && (
                  <p className="text-sm text-muted-foreground italic">
                    Note: {session.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredSessions.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No CBI sessions found.</p>
            <button
              onClick={() => setShowPlanner(true)}
              className="mt-4 px-4 py-2 text-primary hover:underline"
            >
              Plan your first session
            </button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
