"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { 
  BookOpen, 
  Target, 
  Volume2, 
  Brain,
  PenTool,
  Sparkles,
  FileText,
  Users,
  TrendingUp,
  Clock,
  Calendar,
  ChevronRight,
  Award,
  BarChart3
} from "lucide-react";

// Mock data for dashboard
const DASHBOARD_DATA = {
  studentName: "Sample Student",
  profileId: "sample-profile-id",
  overallProgress: 45,
  currentPhase: "Phonics Foundations",
  lessonsCompleted: 24,
  totalPracticeMinutes: 480,
  streakDays: 7,
  nextLesson: {
    title: "Long Vowel Teams: AI and AY",
    type: "Phonics & Decoding",
    duration: 20
  },
  skillAreas: [
    { name: "Phonological Awareness", progress: 65, icon: <Brain className="h-5 w-5" /> },
    { name: "Phonics & Decoding", progress: 45, icon: <Target className="h-5 w-5" /> },
    { name: "Sight Words", progress: 55, icon: <BookOpen className="h-5 w-5" /> },
    { name: "Fluency", progress: 35, icon: <Volume2 className="h-5 w-5" /> },
    { name: "Comprehension", progress: 40, icon: <FileText className="h-5 w-5" /> },
    { name: "Spelling", progress: 30, icon: <PenTool className="h-5 w-5" /> },
  ],
  recentActivity: [
    { date: "Today", activity: "Completed Long A vowel team lesson", type: "lesson" },
    { date: "Yesterday", activity: "Practiced 15 sight words", type: "practice" },
    { date: "2 days ago", activity: "Fluency assessment: 45 WCPM", type: "assessment" },
  ]
};

const QUICK_LINKS = [
  { href: "/dyslexia/profile", icon: <Users className="h-5 w-5" />, label: "Profile", description: "View and edit profile" },
  { href: "/dyslexia/phonological", icon: <Brain className="h-5 w-5" />, label: "Phonological", description: "Awareness skills" },
  { href: "/dyslexia/phonics", icon: <Target className="h-5 w-5" />, label: "Phonics", description: "Decoding practice" },
  { href: "/dyslexia/sight-words", icon: <BookOpen className="h-5 w-5" />, label: "Sight Words", description: "Word recognition" },
  { href: "/dyslexia/fluency", icon: <Volume2 className="h-5 w-5" />, label: "Fluency", description: "Reading speed" },
  { href: "/dyslexia/comprehension", icon: <FileText className="h-5 w-5" />, label: "Comprehension", description: "Understanding text" },
  { href: "/dyslexia/spelling", icon: <PenTool className="h-5 w-5" />, label: "Spelling", description: "Pattern mastery" },
  { href: "/dyslexia/activities", icon: <Sparkles className="h-5 w-5" />, label: "Activities", description: "Multisensory" },
  { href: "/dyslexia/lessons", icon: <Calendar className="h-5 w-5" />, label: "Lessons", description: "Lesson plans" },
  { href: "/dyslexia/parent", icon: <Users className="h-5 w-5" />, label: "Parent Portal", description: "Home practice" },
  { href: "/dyslexia/report", icon: <BarChart3 className="h-5 w-5" />, label: "Reports", description: "Progress reports" },
];

export default function DyslexiaDashboardPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-blue-600" />
            Dyslexia Intervention Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Orton-Gillingham based structured literacy program
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dyslexia/lessons">
            <Button>
              <Calendar className="h-4 w-4 mr-2" />
              Start Next Lesson
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{DASHBOARD_DATA.overallProgress}%</div>
                <div className="text-sm text-muted-foreground">Overall Progress</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <BookOpen className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{DASHBOARD_DATA.lessonsCompleted}</div>
                <div className="text-sm text-muted-foreground">Lessons Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-theme-primary/10 rounded-lg">
                <Clock className="h-5 w-5 text-theme-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{DASHBOARD_DATA.totalPracticeMinutes}</div>
                <div className="text-sm text-muted-foreground">Practice Minutes</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Award className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{DASHBOARD_DATA.streakDays} days</div>
                <div className="text-sm text-muted-foreground">Current Streak</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Progress Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Next Lesson */}
          <Card className="bg-gradient-to-r from-blue-50 to-theme-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Next Lesson
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{DASHBOARD_DATA.nextLesson.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">{DASHBOARD_DATA.nextLesson.type}</Badge>
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {DASHBOARD_DATA.nextLesson.duration} min
                    </span>
                  </div>
                </div>
                <Link href="/dyslexia/lessons">
                  <Button size="lg">
                    Start Lesson
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Skill Areas Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Skill Area Progress</CardTitle>
              <CardDescription>Track mastery across all literacy domains</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {DASHBOARD_DATA.skillAreas.map((skill) => (
                  <div key={skill.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm font-medium">
                        {skill.icon}
                        {skill.name}
                      </span>
                      <span className="text-sm text-muted-foreground">{skill.progress}%</span>
                    </div>
                    <Progress value={skill.progress} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {DASHBOARD_DATA.recentActivity.map((activity, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <div className="p-1.5 bg-background rounded">
                      {activity.type === "lesson" && <BookOpen className="h-4 w-4 text-blue-600" />}
                      {activity.type === "practice" && <Target className="h-4 w-4 text-green-600" />}
                      {activity.type === "assessment" && <BarChart3 className="h-4 w-4 text-theme-primary" />}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{activity.activity}</div>
                      <div className="text-xs text-muted-foreground">{activity.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Navigation</CardTitle>
              <CardDescription>Access all intervention areas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {QUICK_LINKS.map((link) => (
                  <Link key={link.href} href={link.href}>
                    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                      <div className="p-2 bg-muted rounded-lg">
                        {link.icon}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{link.label}</div>
                        <div className="text-xs text-muted-foreground">{link.description}</div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Current Phase */}
          <Card className="bg-theme-primary/10 border-theme-primary/20">
            <CardContent className="p-4">
              <div className="text-sm text-theme-primary font-medium">Current Phase</div>
              <div className="text-lg font-bold text-theme-primary">{DASHBOARD_DATA.currentPhase}</div>
              <div className="mt-2 text-sm text-theme-primary">
                Mastering foundational phonics patterns before advancing to complex vowel teams
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
