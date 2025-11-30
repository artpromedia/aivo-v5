"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, Settings } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { BinderCheckIn, type BinderOrganization, type BinderCheckInRecord } from "@/components/adhd";

// Mock data
const mockBinderOrg: BinderOrganization = {
  id: "binder-1",
  learnerId: "learner-1",
  sections: [
    {
      id: "section-1",
      name: "Math",
      color: "#3b82f6",
      subjects: ["Algebra", "Geometry"],
      isOrganized: true,
      lastChecked: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "section-2",
      name: "English",
      color: "#22c55e",
      subjects: ["Literature", "Writing"],
      isOrganized: true,
      lastChecked: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "section-3",
      name: "Science",
      color: "#a855f7",
      subjects: ["Biology", "Chemistry"],
      isOrganized: false,
      lastChecked: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "section-4",
      name: "History",
      color: "#f97316",
      subjects: ["US History"],
      isOrganized: true,
      lastChecked: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "section-5",
      name: "Handouts",
      color: "#ec4899",
      subjects: ["Misc papers", "Permission slips"],
      isOrganized: false,
    },
  ],
  checkInFrequency: "WEEKLY",
  lastCheckIn: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  checkInHistory: [
    {
      id: "checkin-1",
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      sectionsChecked: ["section-1", "section-2", "section-4"],
      allOrganized: false,
      notes: "Science section needs organizing",
    },
    {
      id: "checkin-2",
      date: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
      sectionsChecked: ["section-1", "section-2", "section-3", "section-4", "section-5"],
      allOrganized: true,
    },
  ],
  tips: [
    "File new papers within 24 hours of receiving them",
    "Keep a 'to file' pocket at the front of your binder",
    "Do a quick 2-minute check at the end of each school day",
    "Use colored dividers that match your section colors",
  ],
  createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date().toISOString(),
};

export default function ADHDBinderPage() {
  const params = useParams();
  const router = useRouter();
  const learnerId = (params?.learnerId as string) || "";

  const [binderOrg, setBinderOrg] = useState<BinderOrganization>(mockBinderOrg);

  const handleCheckIn = async (record: Omit<BinderCheckInRecord, "id">) => {
    // TODO: API call
    const newRecord: BinderCheckInRecord = {
      ...record,
      id: `checkin-${Date.now()}`,
    };

    setBinderOrg((prev) => ({
      ...prev,
      lastCheckIn: record.date,
      checkInHistory: [newRecord, ...prev.checkInHistory],
      sections: prev.sections.map((s) => ({
        ...s,
        isOrganized: record.sectionsChecked.includes(s.id),
        lastChecked: record.sectionsChecked.includes(s.id) ? record.date : s.lastChecked,
      })),
    }));
  };

  const handleUpdateSection = async (sectionId: string, updates: Partial<typeof binderOrg.sections[0]>) => {
    // TODO: API call
    setBinderOrg((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === sectionId ? { ...s, ...updates } : s
      ),
    }));
  };

  // Calculate stats
  const organizedCount = binderOrg.sections.filter((s) => s.isOrganized).length;
  const totalCount = binderOrg.sections.length;
  const weeklyCheckIns = binderOrg.checkInHistory.filter((c) => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return new Date(c.date) > weekAgo;
  }).length;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Binder Organization</h1>
            <p className="text-muted-foreground">
              Track binder organization with regular check-ins
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Organized Sections</CardDescription>
            <CardTitle className="text-3xl">
              {organizedCount}/{totalCount}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500"
                style={{ width: `${(organizedCount / totalCount) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Check-ins This Week</CardDescription>
            <CardTitle className="text-3xl">{weeklyCheckIns}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Goal: {binderOrg.checkInFrequency === "DAILY" ? "7" : binderOrg.checkInFrequency === "WEEKLY" ? "1" : "0.5"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Streak</CardDescription>
            <CardTitle className="text-3xl">3 weeks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Consecutive weekly check-ins</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Binder Check-In */}
        <BinderCheckIn
          binderOrg={binderOrg}
          onCheckIn={handleCheckIn}
          onUpdateSection={handleUpdateSection}
        />

        {/* Section Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Binder Sections</CardTitle>
                <CardDescription>Manage your binder organization</CardDescription>
              </div>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Add Section
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {binderOrg.sections.map((section) => (
              <div
                key={section.id}
                className="flex items-center gap-3 p-3 rounded-lg border"
              >
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: section.color }}
                />
                <div className="flex-1">
                  <h4 className="font-medium">{section.name}</h4>
                  <p className="text-xs text-muted-foreground">
                    {section.subjects.join(", ")}
                  </p>
                </div>
                <div className="text-right">
                  <div
                    className={`text-xs font-medium ${
                      section.isOrganized ? "text-green-600" : "text-orange-600"
                    }`}
                  >
                    {section.isOrganized ? "Organized" : "Needs attention"}
                  </div>
                  {section.lastChecked && (
                    <p className="text-xs text-muted-foreground">
                      Last: {new Date(section.lastChecked).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
