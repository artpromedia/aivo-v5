"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Plus, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { VisualScheduleEditor, VisualScheduleViewer, type VisualSchedule, type ScheduleItem } from "@/components/autism";

export default function SchedulesPage() {
  const params = useParams();
  const router = useRouter();
  const learnerId = (params?.learnerId as string) || "";
  const [schedules, setSchedules] = useState<VisualSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<VisualSchedule | undefined>();
  const [viewingSchedule, setViewingSchedule] = useState<VisualSchedule | undefined>();

  useEffect(() => {
    loadSchedules();
  }, [learnerId]);

  const loadSchedules = async () => {
    try {
      const response = await fetch(`/api/autism/schedules?learner_id=${learnerId}`);
      if (response.ok) {
        const data = await response.json();
        setSchedules(data);
      }
    } catch (error) {
      console.error("Failed to load schedules:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (schedule: VisualSchedule) => {
    try {
      const method = schedule.id ? "PUT" : "POST";
      const url = schedule.id ? `/api/autism/schedules/${schedule.id}` : `/api/autism/schedules`;
      
      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...schedule, learner_id: learnerId }),
      });
      
      await loadSchedules();
      setShowEditor(false);
      setEditingSchedule(undefined);
    } catch (error) {
      console.error("Failed to save schedule:", error);
    }
  };

  const handleItemComplete = async (scheduleId: string, itemIndex: number, completed: boolean) => {
    try {
      await fetch(`/api/autism/schedules/${scheduleId}/items/${itemIndex}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed }),
      });
      await loadSchedules();
    } catch (error) {
      console.error("Failed to update item:", error);
    }
  };

  // Find today's schedule
  const todaySchedule = schedules.find((s) => s.type === "daily" && s.isActive);

  if (showEditor) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => { setShowEditor(false); setEditingSchedule(undefined); }}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Schedules
          </Button>
        </div>
        <VisualScheduleEditor
          learnerId={learnerId}
          schedule={editingSchedule}
          onSave={handleSave}
          onCancel={() => { setShowEditor(false); setEditingSchedule(undefined); }}
        />
      </div>
    );
  }

  if (viewingSchedule) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => setViewingSchedule(undefined)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Schedules
          </Button>
          <div className="flex-1" />
          <Button variant="outline" onClick={() => { setEditingSchedule(viewingSchedule); setViewingSchedule(undefined); setShowEditor(true); }}>
            Edit Schedule
          </Button>
        </div>
        <VisualScheduleViewer
          schedule={viewingSchedule}
          onItemComplete={(index: number, completed: boolean) => handleItemComplete(viewingSchedule.id || "", index, completed)}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/teacher/learners/${learnerId}/autism`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6 text-green-600" />
            Visual Schedules
          </h1>
          <p className="text-muted-foreground">
            Create and manage visual schedules
          </p>
        </div>
        <Button onClick={() => setShowEditor(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Schedule
        </Button>
      </div>

      {/* Today's Schedule */}
      {todaySchedule && (
        <Card className="mb-6 border-2 border-green-400">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Today&apos;s Schedule
              </CardTitle>
              <Badge className="bg-green-600">Active</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {todaySchedule.items?.slice(0, 6).map((item: ScheduleItem, i: number) => (
                <div
                  key={i}
                  className={`flex-shrink-0 p-3 rounded-lg border-2 w-28 text-center ${
                    item.isCompleted
                      ? "border-green-400 bg-green-50 dark:bg-green-900/30"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <div className="text-xs text-muted-foreground">{item.startTime}</div>
                  <div className="font-medium text-sm mt-1 truncate">{item.title}</div>
                </div>
              ))}
            </div>
            <Button
              className="mt-4"
              onClick={() => setViewingSchedule(todaySchedule)}
            >
              View Full Schedule
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Schedule Library */}
      <Tabs defaultValue="all">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Schedules</TabsTrigger>
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {isLoading ? (
            <div className="text-center py-12">Loading...</div>
          ) : schedules.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Schedules Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create visual schedules to help with daily routines and activities.
                </p>
                <Button onClick={() => setShowEditor(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Schedule
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="cursor-pointer"
                  onClick={() => setViewingSchedule(schedule)}
                >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{schedule.name}</CardTitle>
                        <div className="flex gap-2">
                          <Badge variant="outline">{schedule.type}</Badge>
                          {schedule.isActive && <Badge className="bg-green-600">Active</Badge>}
                        </div>
                      </div>
                      <CardDescription>
                        {schedule.items?.length || 0} items
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-1 overflow-hidden">
                        {schedule.items?.slice(0, 5).map((item: ScheduleItem, i: number) => (
                          <div
                            key={i}
                            className="w-10 h-10 rounded bg-muted flex items-center justify-center text-xs font-medium shrink-0"
                          >
                            {i + 1}
                          </div>
                        ))}
                        {(schedule.items?.length || 0) > 5 && (
                          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-xs">
                            +{(schedule.items?.length || 0) - 5}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="daily">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {schedules.filter((s) => s.type === "daily").map((schedule) => (
              <div
                key={schedule.id}
                className="cursor-pointer"
                onClick={() => setViewingSchedule(schedule)}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{schedule.name}</CardTitle>
                    <CardDescription>{schedule.items?.length || 0} items</CardDescription>
                  </CardHeader>
                </Card>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="weekly">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {schedules.filter((s) => s.type === "weekly").map((schedule) => (
              <div
                key={schedule.id}
                className="cursor-pointer"
                onClick={() => setViewingSchedule(schedule)}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{schedule.name}</CardTitle>
                    <CardDescription>{schedule.items?.length || 0} items</CardDescription>
                  </CardHeader>
                </Card>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {schedules.filter((s) => s.type === "activity").map((schedule) => (
              <div
                key={schedule.id}
                className="cursor-pointer"
                onClick={() => setViewingSchedule(schedule)}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{schedule.name}</CardTitle>
                    <CardDescription>{schedule.items?.length || 0} items</CardDescription>
                  </CardHeader>
                </Card>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
