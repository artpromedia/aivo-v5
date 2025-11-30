"use client";

import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Brain,
  Eye,
  Calendar,
  BookOpen,
  BarChart3,
  Star,
  Timer,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function AutismDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const learnerId = (params?.learnerId as string) || "";

  const features = [
    {
      title: "Autism Profile",
      description: "Communication, sensory, and social interaction preferences",
      icon: Brain,
      href: `/teacher/learners/${learnerId}/autism/profile`,
      color: "text-purple-600 bg-purple-100 dark:bg-purple-900",
      badge: null,
    },
    {
      title: "Visual Supports",
      description: "Create and manage visual support cards and materials",
      icon: Eye,
      href: `/teacher/learners/${learnerId}/autism/visuals`,
      color: "text-blue-600 bg-blue-100 dark:bg-blue-900",
      badge: null,
    },
    {
      title: "Visual Schedules",
      description: "Build and view daily visual schedules",
      icon: Calendar,
      href: `/teacher/learners/${learnerId}/autism/schedules`,
      color: "text-green-600 bg-green-100 dark:bg-green-900",
      badge: null,
    },
    {
      title: "Social Stories",
      description: "Create and view social stories with AI assistance",
      icon: BookOpen,
      href: `/teacher/learners/${learnerId}/autism/social-stories`,
      color: "text-orange-600 bg-orange-100 dark:bg-orange-900",
      badge: "AI",
    },
    {
      title: "Behavior Tracking",
      description: "ABC data collection and function analysis",
      icon: BarChart3,
      href: `/teacher/learners/${learnerId}/autism/behavior`,
      color: "text-red-600 bg-red-100 dark:bg-red-900",
      badge: null,
    },
    {
      title: "Token Economy",
      description: "Interactive token boards for reinforcement",
      icon: Star,
      href: `/teacher/learners/${learnerId}/autism/tokens`,
      color: "text-yellow-600 bg-yellow-100 dark:bg-yellow-900",
      badge: null,
    },
    {
      title: "Transition Supports",
      description: "Timers, first/then boards, and transition aids",
      icon: Timer,
      href: `/teacher/learners/${learnerId}/autism/transitions`,
      color: "text-teal-600 bg-teal-100 dark:bg-teal-900",
      badge: null,
    },
    {
      title: "Communication Profile",
      description: "Detailed communication preferences and AAC settings",
      icon: MessageSquare,
      href: `/teacher/learners/${learnerId}/autism/profile#communication`,
      color: "text-pink-600 bg-pink-100 dark:bg-pink-900",
      badge: null,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/teacher/learners/${learnerId}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-600" />
            Autism Support System
          </h1>
          <p className="text-muted-foreground">
            Visual supports, social stories, and behavior tracking tools
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                <Brain className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Profile</p>
                <p className="font-semibold">Complete</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                <Eye className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Visual Supports</p>
                <p className="font-semibold">12 Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900">
                <BookOpen className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Social Stories</p>
                <p className="font-semibold">5 Stories</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900">
                <BarChart3 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="font-semibold">3 Incidents</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.title}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => router.push(feature.href)}
            >
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg ${feature.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    {feature.badge && (
                      <Badge variant="outline" className="text-xs">
                        <Sparkles className="h-3 w-3 mr-1" />
                        {feature.badge}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>

      {/* Today's Schedule Preview */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Today&apos;s Schedule
          </CardTitle>
          <CardDescription>Visual schedule for today</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {[
              { time: "8:00 AM", activity: "Morning Circle", status: "completed" },
              { time: "9:00 AM", activity: "Reading", status: "current" },
              { time: "10:00 AM", activity: "Snack Break", status: "upcoming" },
              { time: "10:30 AM", activity: "Math", status: "upcoming" },
              { time: "11:30 AM", activity: "Lunch", status: "upcoming" },
            ].map((item, i) => (
              <div
                key={i}
                className={`flex-shrink-0 p-3 rounded-lg border-2 w-32 text-center ${
                  item.status === "completed"
                    ? "border-green-400 bg-green-50 dark:bg-green-900/30"
                    : item.status === "current"
                    ? "border-blue-400 bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-400"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                <div className="text-xs text-muted-foreground">{item.time}</div>
                <div className="font-medium mt-1">{item.activity}</div>
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push(`/teacher/learners/${learnerId}/autism/schedules`)}
          >
            View Full Schedule
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
