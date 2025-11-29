'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { TradePathwayExplorer } from '@/components/transition';

/**
 * Vocational Pathways Page
 * Trade programs, apprenticeships, industry certifications
 */

type TradeType = 'CNA' | 'HVAC' | 'AUTOMOTIVE' | 'WELDING' | 'COSMETOLOGY' | 'ELECTRICAL' | 'CULINARY' | 'CDL' | 'PLUMBING' | 'IT';

interface TradeProgram {
  id: string;
  name: string;
  trade: string;
  provider: string;
  providerType: string;
  city?: string;
  state?: string;
  isOnline: boolean;
  duration: number;
  tuition: number;
  jobPlacementRate?: number;
  averageStartingSalary?: number;
  medianSalary?: number;
  certificationsEarned: string[];
  disabilityServicesAvailable: boolean;
  accommodationsOffered: string[];
}

interface TradeSummary {
  trade: string;
  programCount: number;
  avgPlacementRate: number;
  avgStartingSalary: number;
  tuitionRange: { min: number; max: number };
}

interface Certification {
  id: string;
  name: string;
  trade: TradeType;
  issuer: string;
  status: 'not-started' | 'in-progress' | 'earned';
  earnedDate?: string;
  expiresDate?: string;
  renewalRequired: boolean;
}

// Sample trade programs for the explorer
const samplePrograms: TradeProgram[] = [
  {
    id: 'tp1',
    name: 'Automotive Technology Certificate',
    trade: 'AUTOMOTIVE',
    provider: 'Metro Technical College',
    providerType: 'Community College',
    city: 'Springfield',
    state: 'IL',
    duration: 48,
    tuition: 8500,
    jobPlacementRate: 92,
    averageStartingSalary: 38000,
    isOnline: false,
    disabilityServicesAvailable: true,
    certificationsEarned: ['ASE Student Certification'],
    accommodationsOffered: ['Extended time', 'Quiet testing', 'Note-taking assistance'],
  },
  {
    id: 'tp2',
    name: 'ASE Prep Program',
    trade: 'AUTOMOTIVE',
    provider: 'Career Training Institute',
    providerType: 'Vocational School',
    city: 'Capital City',
    state: 'IL',
    duration: 24,
    tuition: 4200,
    jobPlacementRate: 88,
    averageStartingSalary: 35000,
    isOnline: false,
    disabilityServicesAvailable: true,
    certificationsEarned: ['ASE Brakes', 'ASE Electrical'],
    accommodationsOffered: ['Extended time', 'Modified equipment'],
  },
  {
    id: 'tp3',
    name: 'HVAC Technician Program',
    trade: 'HVAC',
    provider: 'Technical Skills Center',
    providerType: 'Trade School',
    city: 'Riverside',
    state: 'IL',
    duration: 36,
    tuition: 7800,
    jobPlacementRate: 94,
    averageStartingSalary: 42000,
    isOnline: false,
    disabilityServicesAvailable: true,
    certificationsEarned: ['EPA 608', 'NATE Core'],
    accommodationsOffered: ['Extended time', 'Hands-on alternatives'],
  },
  {
    id: 'tp4',
    name: 'Welding Fundamentals',
    trade: 'WELDING',
    provider: 'Industrial Training Academy',
    providerType: 'Trade School',
    city: 'Springfield',
    state: 'IL',
    duration: 32,
    tuition: 6500,
    jobPlacementRate: 89,
    averageStartingSalary: 40000,
    isOnline: false,
    disabilityServicesAvailable: false,
    certificationsEarned: ['AWS D1.1'],
    accommodationsOffered: [],
  },
  {
    id: 'tp5',
    name: 'CNA Certification Course',
    trade: 'CNA',
    provider: 'Healthcare Career Center',
    providerType: 'Career Center',
    city: 'Springfield',
    state: 'IL',
    duration: 12,
    tuition: 1800,
    jobPlacementRate: 96,
    averageStartingSalary: 32000,
    isOnline: false,
    disabilityServicesAvailable: true,
    certificationsEarned: ['State CNA License'],
    accommodationsOffered: ['Extended time', 'Modified clinical settings'],
  },
];

const tradeSummaries: TradeSummary[] = [
  { trade: 'AUTOMOTIVE', programCount: 2, avgPlacementRate: 90, avgStartingSalary: 36500, tuitionRange: { min: 4200, max: 8500 } },
  { trade: 'HVAC', programCount: 1, avgPlacementRate: 94, avgStartingSalary: 42000, tuitionRange: { min: 7800, max: 7800 } },
  { trade: 'WELDING', programCount: 1, avgPlacementRate: 89, avgStartingSalary: 40000, tuitionRange: { min: 6500, max: 6500 } },
  { trade: 'CNA', programCount: 1, avgPlacementRate: 96, avgStartingSalary: 32000, tuitionRange: { min: 1800, max: 1800 } },
];

const mockCertifications: Certification[] = [
  {
    id: 'cert1',
    name: 'ASE Student Certification - Brakes',
    trade: 'AUTOMOTIVE',
    issuer: 'ASE',
    status: 'earned',
    earnedDate: '2024-02-15',
    expiresDate: '2029-02-15',
    renewalRequired: true,
  },
  {
    id: 'cert2',
    name: 'ASE Student Certification - Electrical',
    trade: 'AUTOMOTIVE',
    issuer: 'ASE',
    status: 'in-progress',
    renewalRequired: true,
  },
  {
    id: 'cert3',
    name: 'OSHA 10-Hour Safety',
    trade: 'AUTOMOTIVE',
    issuer: 'OSHA',
    status: 'not-started',
    renewalRequired: false,
  },
];

const certStatusColors: Record<string, { bg: string; text: string }> = {
  'not-started': { bg: 'bg-gray-100', text: 'text-gray-700' },
  'in-progress': { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  'earned': { bg: 'bg-green-100', text: 'text-green-700' },
};

export default function VocationalPathwaysPage() {
  const params = useParams();
  const [activeTab, setActiveTab] = useState<'explore' | 'applied' | 'certifications'>('explore');

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <nav className="text-sm text-gray-500 mb-2">
            <a href="../transition" className="hover:text-indigo-600">Transition</a>
            <span className="mx-2">/</span>
            <span className="text-gray-900">Vocational Pathways</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900">Vocational Pathways</h1>
          <p className="text-gray-600">Trade programs, apprenticeships, and industry certifications</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Career Interest</div>
            <div className="text-lg font-bold text-indigo-600">Automotive Technology</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Programs Applied</div>
            <div className="text-2xl font-bold">2</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Certifications</div>
            <div className="text-2xl font-bold">
              {mockCertifications.filter(c => c.status === 'earned').length}
              <span className="text-sm text-gray-500 font-normal"> earned</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Projected Salary</div>
            <div className="text-2xl font-bold text-green-600">$38k</div>
            <div className="text-xs text-gray-500">average starting</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {[
            { id: 'explore', label: 'Explore Programs', icon: '🔍' },
            { id: 'applied', label: 'Applied Programs', icon: '📋' },
            { id: 'certifications', label: 'Certifications', icon: '📜' },
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

      {/* Explore Tab */}
      {activeTab === 'explore' && (
        <TradePathwayExplorer
          programs={samplePrograms}
          tradeSummaries={tradeSummaries}
          onProgramSelect={(program) => console.log('Selected:', program)}
          onApply={(program) => console.log('Apply to:', program)}
        />
      )}

      {/* Applied Programs Tab */}
      {activeTab === 'applied' && (
        <div className="space-y-4">
          <Card>
            <CardHeader title="Program Applications" subtitle="Track your program applications" />
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-semibold">Automotive Technology Certificate</h4>
                    <p className="text-sm text-gray-600">Metro Technical College</p>
                    <p className="text-xs text-gray-500 mt-1">Applied: March 10, 2024</p>
                  </div>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                    Under Review
                  </span>
                </div>

                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-semibold">ASE Prep Program</h4>
                    <p className="text-sm text-gray-600">Career Training Institute</p>
                    <p className="text-xs text-gray-500 mt-1">Applied: March 5, 2024</p>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                    Accepted
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Application Checklist */}
          <Card>
            <CardHeader title="Application Checklist" />
            <CardContent>
              <div className="space-y-3">
                {[
                  { item: 'High school transcript', completed: true },
                  { item: 'IEP/504 documentation', completed: true },
                  { item: 'Letter of recommendation', completed: true },
                  { item: 'Application form', completed: true },
                  { item: 'Financial aid application (FAFSA)', completed: false },
                  { item: 'Disability services intake form', completed: false },
                ].map((check, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className={check.completed ? 'text-green-600' : 'text-gray-400'}>
                      {check.completed ? '✓' : '○'}
                    </span>
                    <span className={check.completed ? 'text-gray-700' : 'text-gray-500'}>
                      {check.item}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Certifications Tab */}
      {activeTab === 'certifications' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Industry Certifications</h2>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
              + Add Certification
            </button>
          </div>

          {/* Certification Cards */}
          {mockCertifications.map((cert) => (
            <Card key={cert.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{cert.name}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs ${certStatusColors[cert.status].bg} ${certStatusColors[cert.status].text}`}>
                        {cert.status === 'earned' ? '✓ Earned' : cert.status === 'in-progress' ? 'In Progress' : 'Not Started'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">Issued by: {cert.issuer}</p>
                    
                    <div className="flex gap-4 mt-2 text-sm text-gray-500">
                      {cert.earnedDate && <span>📅 Earned: {cert.earnedDate}</span>}
                      {cert.expiresDate && <span>⏰ Expires: {cert.expiresDate}</span>}
                      {cert.renewalRequired && <span>🔄 Renewal Required</span>}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {cert.status === 'not-started' && (
                      <button className="px-3 py-1 bg-indigo-600 text-white rounded text-sm">
                        Start Prep
                      </button>
                    )}
                    {cert.status === 'in-progress' && (
                      <button className="px-3 py-1 bg-indigo-600 text-white rounded text-sm">
                        Continue
                      </button>
                    )}
                    {cert.status === 'earned' && (
                      <button className="px-3 py-1 border rounded text-sm">
                        View Certificate
                      </button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Recommended Certifications */}
          <Card>
            <CardHeader title="Recommended Certifications" subtitle="Based on career interests" />
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { name: 'ASE A1 - Engine Repair', level: 'Professional', time: '40 hours prep' },
                  { name: 'ASE A4 - Suspension & Steering', level: 'Professional', time: '35 hours prep' },
                  { name: 'EPA 608 Certification', level: 'Entry', time: '8 hours prep' },
                  { name: 'OSHA 30-Hour Construction', level: 'Professional', time: '30 hours' },
                ].map((rec, i) => (
                  <div key={i} className="p-3 border rounded-lg flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">{rec.name}</h4>
                      <p className="text-xs text-gray-500">{rec.level} • {rec.time}</p>
                    </div>
                    <button className="px-3 py-1 border border-indigo-600 text-indigo-600 rounded text-sm hover:bg-indigo-50">
                      Add
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
