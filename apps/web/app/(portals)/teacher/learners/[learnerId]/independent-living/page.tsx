'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Wallet,
  UtensilsCrossed,
  Bus,
  Home,
  Heart,
  Building2,
  TrendingUp,
  Target,
  MapPin,
  Calendar,
  ChevronRight,
  Plus,
} from 'lucide-react';

/**
 * Independent Living Skills Dashboard
 * Comprehensive functional life skills tracking system
 * 
 * Features:
 * - Overview of all 6 ILS domains
 * - Progress tracking across skills
 * - Community-based instruction scheduling
 * - Generalization tracking across settings
 */

// Domain configuration
const domains = [
  {
    id: 'MONEY_MANAGEMENT',
    label: 'Money Management',
    icon: Wallet,
    color: 'bg-green-100 text-green-700',
    description: 'Coins, bills, budgeting, banking',
  },
  {
    id: 'COOKING_NUTRITION',
    label: 'Cooking & Nutrition',
    icon: UtensilsCrossed,
    color: 'bg-orange-100 text-orange-700',
    description: 'Meal prep, kitchen safety, nutrition',
  },
  {
    id: 'TRANSPORTATION',
    label: 'Transportation',
    icon: Bus,
    color: 'bg-blue-100 text-blue-700',
    description: 'Public transit, safety, navigation',
  },
  {
    id: 'HOUSING_HOME_CARE',
    label: 'Housing & Home Care',
    icon: Home,
    color: 'bg-theme-primary/10 text-theme-primary',
    description: 'Cleaning, laundry, home maintenance',
  },
  {
    id: 'HEALTH_SAFETY',
    label: 'Health & Safety',
    icon: Heart,
    color: 'bg-red-100 text-red-700',
    description: 'Personal care, medical, emergency',
  },
  {
    id: 'COMMUNITY_RESOURCES',
    label: 'Community Resources',
    icon: Building2,
    color: 'bg-yellow-100 text-yellow-700',
    description: 'Library, post office, services',
  },
];

// Mock data - replace with API calls
const mockDashboardStats = {
  totalSkillsTracked: 24,
  skillsImproving: 18,
  skillsMastered: 6,
  upcomingCBISessions: 3,
  activeGoals: 8,
  avgProgress: 67,
};

const mockDomainProgress = {
  MONEY_MANAGEMENT: { skills: 5, avgProgress: 72, improving: 4 },
  COOKING_NUTRITION: { skills: 6, avgProgress: 58, improving: 4 },
  TRANSPORTATION: { skills: 3, avgProgress: 45, improving: 2 },
  HOUSING_HOME_CARE: { skills: 4, avgProgress: 80, improving: 3 },
  HEALTH_SAFETY: { skills: 4, avgProgress: 75, improving: 3 },
  COMMUNITY_RESOURCES: { skills: 2, avgProgress: 60, improving: 2 },
};

const mockRecentActivity = [
  { id: '1', type: 'data', skill: 'Making Change', date: '2024-05-15', result: '85% accuracy' },
  { id: '2', type: 'cbi', skill: 'Using Public Transit', date: '2024-05-14', result: 'Completed' },
  { id: '3', type: 'goal', skill: 'Meal Planning', date: '2024-05-13', result: 'Goal achieved' },
  { id: '4', type: 'data', skill: 'Laundry - Sorting', date: '2024-05-12', result: '90% accuracy' },
];

const mockUpcomingCBI = [
  { id: '1', location: 'Grocery Store', date: '2024-05-18', skills: ['Shopping List', 'Making Change'] },
  { id: '2', location: 'Bus Station', date: '2024-05-20', skills: ['Reading Schedule', 'Purchasing Ticket'] },
  { id: '3', location: 'Bank', date: '2024-05-22', skills: ['Deposit/Withdrawal', 'ATM Use'] },
];

export default function IndependentLivingPage() {
  const params = useParams();
  const learnerId = params?.learnerId as string;
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);

  const basePath = `/teacher/learners/${learnerId}/independent-living`;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">Independent Living Skills</h1>
          <p className="text-muted-foreground">
            Functional life skills training across 6 domains with community-based instruction
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`${basePath}/skills`}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Skill
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold">{mockDashboardStats.totalSkillsTracked}</p>
            <p className="text-sm text-muted-foreground">Skills Tracked</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{mockDashboardStats.skillsImproving}</p>
            <p className="text-sm text-muted-foreground">Improving</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-theme-primary">{mockDashboardStats.skillsMastered}</p>
            <p className="text-sm text-muted-foreground">Mastered</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{mockDashboardStats.upcomingCBISessions}</p>
            <p className="text-sm text-muted-foreground">Upcoming CBI</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-orange-600">{mockDashboardStats.activeGoals}</p>
            <p className="text-sm text-muted-foreground">Active Goals</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold">{mockDashboardStats.avgProgress}%</p>
            <p className="text-sm text-muted-foreground">Avg Progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Domain Cards */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Skill Domains</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {domains.map((domain) => {
            const progress = mockDomainProgress[domain.id as keyof typeof mockDomainProgress];
            const Icon = domain.icon;

            return (
              <Link
                key={domain.id}
                href={`${basePath}/skills?domain=${domain.id}`}
              >
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-lg ${domain.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <Badge variant="outline">{progress.skills} skills</Badge>
                    </div>
                    <h3 className="font-semibold mt-2">{domain.label}</h3>
                    <p className="text-sm text-muted-foreground">{domain.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{progress.avgProgress}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${progress.avgProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {progress.improving} skills improving
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Recent Activity</h3>
              <Link
                href={`${basePath}/progress`}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                View All <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockRecentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{activity.skill}</p>
                    <p className="text-sm text-muted-foreground">
                      {activity.type === 'data' && 'Data recorded'}
                      {activity.type === 'cbi' && 'CBI session'}
                      {activity.type === 'goal' && 'Goal update'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{activity.result}</p>
                    <p className="text-xs text-muted-foreground">{activity.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming CBI */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Upcoming CBI Sessions</h3>
              <Link
                href={`${basePath}/cbi`}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                View All <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockUpcomingCBI.map((session) => (
                <div
                  key={session.id}
                  className="p-3 border rounded-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{session.location}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {session.date}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {session.skills.map((skill) => (
                      <Badge key={skill} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold">Quick Links</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href={`${basePath}/skills`}
              className="p-4 border rounded-lg hover:bg-muted text-center"
            >
              <Target className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="font-medium">Skill Catalog</p>
              <p className="text-xs text-muted-foreground">Browse all skills</p>
            </Link>
            <Link
              href={`${basePath}/progress`}
              className="p-4 border rounded-lg hover:bg-muted text-center"
            >
              <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-600" />
              <p className="font-medium">Progress Tracking</p>
              <p className="text-xs text-muted-foreground">View data & trends</p>
            </Link>
            <Link
              href={`${basePath}/cbi`}
              className="p-4 border rounded-lg hover:bg-muted text-center"
            >
              <MapPin className="h-6 w-6 mx-auto mb-2 text-blue-600" />
              <p className="font-medium">CBI Sessions</p>
              <p className="text-xs text-muted-foreground">Community training</p>
            </Link>
            <Link
              href={`${basePath}/goals`}
              className="p-4 border rounded-lg hover:bg-muted text-center"
            >
              <Target className="h-6 w-6 mx-auto mb-2 text-orange-600" />
              <p className="font-medium">ILS Goals</p>
              <p className="text-xs text-muted-foreground">Set & track goals</p>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
