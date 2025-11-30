"use client";

import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  FolderOpen,
  Clock,
  Brain,
  Target,
  ListTodo,
  PieChart,
  Users,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function ADHDDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const learnerId = (params?.learnerId as string) || "";

  const features = [
    {
      title: "Assignment Tracker",
      description: "View all assignments with color-coded urgency and status tracking",
      icon: ListTodo,
      href: `/teacher/learners/${learnerId}/adhd/assignments`,
      color: "text-blue-600 bg-blue-100 dark:bg-blue-900",
      badge: null,
    },
    {
      title: "Project Breakdowns",
      description: "AI-powered project breakdown into manageable steps",
      icon: Sparkles,
      href: `/teacher/learners/${learnerId}/adhd/projects`,
      color: "text-purple-600 bg-purple-100 dark:bg-purple-900",
      badge: "AI",
    },
    {
      title: "Daily Planner",
      description: "Visual time blocking and daily schedule builder",
      icon: Calendar,
      href: `/teacher/learners/${learnerId}/adhd/planner`,
      color: "text-green-600 bg-green-100 dark:bg-green-900",
      badge: null,
    },
    {
      title: "Binder Organization",
      description: "Track binder organization with regular check-ins",
      icon: FolderOpen,
      href: `/teacher/learners/${learnerId}/adhd/binder`,
      color: "text-orange-600 bg-orange-100 dark:bg-orange-900",
      badge: null,
    },
    {
      title: "Study Sessions",
      description: "Pomodoro timer and focus tracking tools",
      icon: Clock,
      href: `/teacher/learners/${learnerId}/adhd/study`,
      color: "text-pink-600 bg-pink-100 dark:bg-pink-900",
      badge: null,
    },
    {
      title: "EF Assessment",
      description: "Executive function profile and skill ratings",
      icon: Brain,
      href: `/teacher/learners/${learnerId}/adhd/ef-assessment`,
      color: "text-indigo-600 bg-indigo-100 dark:bg-indigo-900",
      badge: null,
    },
    {
      title: "Interventions",
      description: "Track EF intervention strategies and effectiveness",
      icon: Target,
      href: `/teacher/learners/${learnerId}/adhd/interventions`,
      color: "text-yellow-600 bg-yellow-100 dark:bg-yellow-900",
      badge: null,
    },
    {
      title: "Parent View",
      description: "Parent dashboard with assignment overview",
      icon: Users,
      href: `/teacher/learners/${learnerId}/adhd/parent-view`,
      color: "text-cyan-600 bg-cyan-100 dark:bg-cyan-900",
      badge: null,
    },
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">ADHD/EF Support</h1>
          <p className="text-muted-foreground">
            Organizational tools, project breakdown, daily planning, and executive function support
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Upcoming</CardDescription>
            <CardTitle className="text-3xl">5</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Assignments due this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Critical</CardDescription>
            <CardTitle className="text-3xl text-red-600">2</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Assignments need attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Focus Time</CardDescription>
            <CardTitle className="text-3xl">3.5h</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">This week via Pomodoro</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>EF Score</CardDescription>
            <CardTitle className="text-3xl">3.2</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Average across 8 domains</p>
          </CardContent>
        </Card>
      </div>

      {/* Feature cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.title}
              className="cursor-pointer"
              onClick={() => router.push(feature.href)}
            >
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg ${feature.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    {feature.badge && (
                      <Badge className="bg-purple-100 text-purple-700">
                        <Sparkles className="h-3 w-3 mr-1" />
                        {feature.badge}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-lg mb-1">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>

      {/* Recent Activity Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest updates and completed tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="p-2 bg-green-100 dark:bg-green-800 rounded-full">
                <ListTodo className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Math homework completed</p>
                <p className="text-sm text-muted-foreground">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-full">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Completed 2 Pomodoro sessions</p>
                <p className="text-sm text-muted-foreground">5 hours ago</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-full">
                <FolderOpen className="h-4 w-4 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Binder check-in completed</p>
                <p className="text-sm text-muted-foreground">Yesterday</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
