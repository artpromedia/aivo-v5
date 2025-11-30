"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BarChart3, Plus, Calendar } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { 
  ABCDataEntry, 
  BehaviorPatternChart, 
  BehaviorFunctionAnalysis,
  type BehaviorIncident 
} from "@/components/autism";

export default function BehaviorTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const learnerId = (params?.learnerId as string) || "";
  const [incidents, setIncidents] = useState<BehaviorIncident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEntry, setShowEntry] = useState(false);
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    end: new Date(),
  });

  useEffect(() => {
    loadIncidents();
  }, [learnerId]);

  const loadIncidents = async () => {
    try {
      const response = await fetch(`/api/autism/behavior?learner_id=${learnerId}`);
      if (response.ok) {
        const data = await response.json();
        setIncidents(data);
      }
    } catch (error) {
      console.error("Failed to load incidents:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (incident: BehaviorIncident) => {
    await loadIncidents();
    setShowEntry(false);
  };

  // Stats
  const thisWeek = incidents.filter((i) => {
    const date = new Date(i.date);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return date >= weekAgo;
  });

  const lastWeek = incidents.filter((i) => {
    const date = new Date(i.date);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    return date >= twoWeeksAgo && date < weekAgo;
  });

  const changePercent = lastWeek.length > 0 
    ? ((thisWeek.length - lastWeek.length) / lastWeek.length) * 100 
    : 0;

  if (showEntry) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => setShowEntry(false)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Overview
          </Button>
        </div>
        <ABCDataEntry
          learnerId={learnerId}
          onSave={handleSave}
          onCancel={() => setShowEntry(false)}
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
            <BarChart3 className="h-6 w-6 text-red-600" />
            Behavior Tracking
          </h1>
          <p className="text-muted-foreground">
            ABC data collection and function analysis
          </p>
        </div>
        <Button onClick={() => setShowEntry(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Record Incident
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{thisWeek.length}</div>
            <div className="text-sm text-muted-foreground">This Week</div>
            {changePercent !== 0 && (
              <Badge 
                variant="outline" 
                className={changePercent > 0 ? "text-red-600" : "text-green-600"}
              >
                {changePercent > 0 ? "+" : ""}{changePercent.toFixed(0)}% vs last week
              </Badge>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{incidents.length}</div>
            <div className="text-sm text-muted-foreground">Total Incidents</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">
              {incidents.filter((i) => i.intensity === "high" || i.intensity === "severe").length}
            </div>
            <div className="text-sm text-muted-foreground">High Intensity</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">
              {new Set(incidents.map((i) => i.behavior)).size}
            </div>
            <div className="text-sm text-muted-foreground">Behavior Types</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="analysis">
        <TabsList className="mb-4">
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="analysis">
          {isLoading ? (
            <div className="text-center py-12">Loading...</div>
          ) : (
            <div className="space-y-6">
              <BehaviorFunctionAnalysis incidents={incidents} />
            </div>
          )}
        </TabsContent>

        <TabsContent value="patterns">
          <BehaviorPatternChart incidents={incidents} dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="history">
          {incidents.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Incidents Recorded</h3>
                <p className="text-muted-foreground mb-4">
                  Start recording behavior incidents using ABC data collection.
                </p>
                <Button onClick={() => setShowEntry(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Record First Incident
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {incidents
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((incident, i) => (
                  <Card key={incident.id || i}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge 
                              variant="outline"
                              className={
                                incident.intensity === "severe" ? "border-red-500 text-red-500" :
                                incident.intensity === "high" ? "border-orange-500 text-orange-500" :
                                incident.intensity === "moderate" ? "border-yellow-500 text-yellow-500" :
                                "border-green-500 text-green-500"
                              }
                            >
                              {incident.intensity}
                            </Badge>
                            <span className="font-semibold">{incident.behavior}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3 inline mr-1" />
                            {incident.date} at {incident.time} • {incident.location}
                          </div>
                        </div>
                        {incident.functionHypothesis && (
                          <Badge>{incident.functionHypothesis}</Badge>
                        )}
                      </div>
                      <div className="mt-3 grid md:grid-cols-3 gap-3 text-sm">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                          <div className="font-medium text-blue-700 dark:text-blue-300">Antecedent</div>
                          <div>{incident.antecedent}</div>
                        </div>
                        <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded">
                          <div className="font-medium text-red-700 dark:text-red-300">Behavior</div>
                          <div>{incident.behaviorDescription || incident.behavior}</div>
                        </div>
                        <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded">
                          <div className="font-medium text-green-700 dark:text-green-300">Consequence</div>
                          <div>{incident.consequence}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
