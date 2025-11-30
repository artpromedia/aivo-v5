"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Timer, Plus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { TransitionTimer, FirstThenBoard, type FirstThenItem } from "@/components/autism";

interface TransitionSupport {
  id?: string;
  learnerId: string;
  name: string;
  type: "timer" | "first-then" | "countdown";
  duration?: number;
  firstItem?: FirstThenItem;
  thenItem?: FirstThenItem;
  warningIntervals?: number[];
  isActive: boolean;
}

export default function TransitionsPage() {
  const params = useParams();
  const router = useRouter();
  const learnerId = (params?.learnerId as string) || "";
  const [supports, setSupports] = useState<TransitionSupport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSupport, setActiveSupport] = useState<TransitionSupport | undefined>();
  const [showCreate, setShowCreate] = useState(false);
  const [createType, setCreateType] = useState<"timer" | "first-then">("timer");
  const [newSupport, setNewSupport] = useState<Partial<TransitionSupport>>({
    name: "",
    type: "timer",
    duration: 300,
    warningIntervals: [60, 30, 10],
    isActive: true,
  });

  useEffect(() => {
    loadSupports();
  }, [learnerId]);

  const loadSupports = async () => {
    try {
      const response = await fetch(`/api/autism/transitions?learner_id=${learnerId}`);
      if (response.ok) {
        const data = await response.json();
        setSupports(data);
      }
    } catch (error) {
      console.error("Failed to load transition supports:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await fetch(`/api/autism/transitions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newSupport, learner_id: learnerId }),
      });
      await loadSupports();
      setShowCreate(false);
      setNewSupport({
        name: "",
        type: "timer",
        duration: 300,
        warningIntervals: [60, 30, 10],
        isActive: true,
      });
    } catch (error) {
      console.error("Failed to create support:", error);
    }
  };

  // Quick timers
  const quickTimers = [
    { name: "5 minutes", duration: 300 },
    { name: "10 minutes", duration: 600 },
    { name: "15 minutes", duration: 900 },
    { name: "2 minutes", duration: 120 },
  ];

  if (activeSupport) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => setActiveSupport(undefined)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        {activeSupport.type === "timer" && (
          <TransitionTimer
            duration={activeSupport.duration || 300}
            warningAt={activeSupport.warningIntervals || [60, 30, 10]}
            activityName={activeSupport.name}
            onComplete={() => {}}
          />
        )}
        {activeSupport.type === "first-then" && activeSupport.firstItem && activeSupport.thenItem && (
          <FirstThenBoard
            firstItem={activeSupport.firstItem}
            thenItem={activeSupport.thenItem}
            title={activeSupport.name}
            onFirstComplete={() => {}}
            onThenComplete={() => {}}
          />
        )}
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
            <Timer className="h-6 w-6 text-teal-600" />
            Transition Supports
          </h1>
          <p className="text-muted-foreground">
            Timers and visual supports for transitions
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Support
        </Button>
      </div>

      {/* Quick Timers */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Quick Timers</CardTitle>
          <CardDescription>Start a timer quickly</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {quickTimers.map((timer) => (
              <Button
                key={timer.name}
                variant="outline"
                onClick={() => setActiveSupport({
                  learnerId,
                  name: timer.name,
                  type: "timer",
                  duration: timer.duration,
                  warningIntervals: [60, 30, 10, 5],
                  isActive: true,
                })}
              >
                <Timer className="h-4 w-4 mr-2" />
                {timer.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create Form */}
      {showCreate && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create Transition Support</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 mb-4">
              <Button
                variant={createType === "timer" ? "default" : "outline"}
                onClick={() => { setCreateType("timer"); setNewSupport({ ...newSupport, type: "timer" }); }}
              >
                <Timer className="h-4 w-4 mr-2" />
                Timer
              </Button>
              <Button
                variant={createType === "first-then" ? "default" : "outline"}
                onClick={() => { setCreateType("first-then"); setNewSupport({ ...newSupport, type: "first-then" }); }}
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                First/Then
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={newSupport.name}
                onChange={(e) => setNewSupport({ ...newSupport, name: e.target.value })}
                placeholder={createType === "timer" ? "e.g., Reading Time" : "e.g., Work Then Play"}
              />
            </div>

            {createType === "timer" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Duration (seconds)</label>
                <Input
                  type="number"
                  value={newSupport.duration}
                  onChange={(e) => setNewSupport({ ...newSupport, duration: parseInt(e.target.value) || 300 })}
                />
              </div>
            )}

            {createType === "first-then" && (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">First Activity</label>
                  <Input
                    value={newSupport.firstItem?.label || ""}
                    onChange={(e) => setNewSupport({ 
                      ...newSupport, 
                      firstItem: { label: e.target.value } 
                    })}
                    placeholder="e.g., Math worksheet"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Then Activity</label>
                  <Input
                    value={newSupport.thenItem?.label || ""}
                    onChange={(e) => setNewSupport({ 
                      ...newSupport, 
                      thenItem: { label: e.target.value } 
                    })}
                    placeholder="e.g., Free time"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreate}
                disabled={!newSupport.name}
              >
                Create Support
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Saved Supports */}
      <Tabs defaultValue="all">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="timers">Timers</TabsTrigger>
          <TabsTrigger value="first-then">First/Then</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {isLoading ? (
            <div className="text-center py-12">Loading...</div>
          ) : supports.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Timer className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Saved Supports Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create timers and first/then boards for common transitions.
                </p>
                <Button onClick={() => setShowCreate(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Support
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {supports.map((support) => (
                <div
                  key={support.id}
                  className="cursor-pointer"
                  onClick={() => setActiveSupport(support)}
                >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{support.name}</CardTitle>
                        <Badge variant="outline">{support.type}</Badge>
                      </div>
                      <CardDescription>
                        {support.type === "timer" && `${Math.floor((support.duration || 0) / 60)} minutes`}
                        {support.type === "first-then" && `${support.firstItem?.label} → ${support.thenItem?.label}`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" className="w-full">
                        Start
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="timers">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {supports.filter((s) => s.type === "timer").map((support) => (
              <div
                key={support.id}
                className="cursor-pointer"
                onClick={() => setActiveSupport(support)}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{support.name}</CardTitle>
                    <CardDescription>{Math.floor((support.duration || 0) / 60)} minutes</CardDescription>
                  </CardHeader>
                </Card>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="first-then">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {supports.filter((s) => s.type === "first-then").map((support) => (
              <div
                key={support.id}
                className="cursor-pointer"
                onClick={() => setActiveSupport(support)}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{support.name}</CardTitle>
                    <CardDescription>
                      {support.firstItem?.label} → {support.thenItem?.label}
                    </CardDescription>
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
