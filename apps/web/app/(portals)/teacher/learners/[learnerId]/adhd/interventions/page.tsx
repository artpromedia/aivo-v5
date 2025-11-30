"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, Filter, Search, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import {
  EFInterventionTracker,
  type EFIntervention,
  type EFDomain,
  type EffectivenessRating,
} from "@/components/adhd";

// Mock data for interventions
const mockInterventions: EFIntervention[] = [
  {
    id: "intervention-1",
    learnerId: "learner-1",
    efDomain: "timeManagement",
    strategy: "Visual Timer",
    description:
      "Use a visual countdown timer during independent work to help student pace themselves.",
    implementer: "TEACHER",
    startDate: "2024-01-15",
    isActive: true,
    effectivenessRatings: [
      { date: "2024-01-20", rating: "EFFECTIVE", notes: "Student responds well to the visual cue." },
      { date: "2024-01-27", rating: "VERY_EFFECTIVE", notes: "Consider using for homework too." },
    ],
    aiSuggested: false,
    createdAt: "2024-01-15T00:00:00Z",
    updatedAt: "2024-01-27T00:00:00Z",
  },
  {
    id: "intervention-2",
    learnerId: "learner-1",
    efDomain: "taskInitiation",
    strategy: "Task Launch Routine",
    description:
      "Before each work period, complete a 3-step launch routine: 1) Gather materials, 2) Read first instruction, 3) Begin first step within 30 seconds.",
    implementer: "STUDENT",
    startDate: "2024-01-20",
    isActive: true,
    effectivenessRatings: [
      { date: "2024-01-25", rating: "SOMEWHAT_EFFECTIVE", notes: "Still needs prompting occasionally." },
    ],
    aiSuggested: true,
    createdAt: "2024-01-20T00:00:00Z",
    updatedAt: "2024-01-25T00:00:00Z",
  },
  {
    id: "intervention-3",
    learnerId: "learner-1",
    efDomain: "organization",
    strategy: "Binder Check",
    description: "Daily binder organization check at end of each school day.",
    implementer: "TEACHER",
    startDate: "2024-01-10",
    isActive: true,
    effectivenessRatings: [
      { date: "2024-01-17", rating: "VERY_EFFECTIVE", notes: "Very effective. Student takes pride in organized binder." },
    ],
    aiSuggested: false,
    createdAt: "2024-01-10T00:00:00Z",
    updatedAt: "2024-01-17T00:00:00Z",
  },
  {
    id: "intervention-4",
    learnerId: "learner-1",
    efDomain: "workingMemory",
    strategy: "Written Directions",
    description: "Provide written directions in addition to verbal instructions for multi-step tasks.",
    implementer: "TEACHER",
    startDate: "2023-12-01",
    endDate: "2024-01-31",
    isActive: false,
    effectivenessRatings: [
      { date: "2024-01-15", rating: "EFFECTIVE", notes: "Student now requests written directions independently." },
    ],
    aiSuggested: false,
    notes: "Completed successfully.",
    createdAt: "2023-12-01T00:00:00Z",
    updatedAt: "2024-01-31T00:00:00Z",
  },
];

const efDomains: { value: EFDomain; label: string }[] = [
  { value: "organization", label: "Organization" },
  { value: "timeManagement", label: "Time Management" },
  { value: "planning", label: "Planning" },
  { value: "taskInitiation", label: "Task Initiation" },
  { value: "workingMemory", label: "Working Memory" },
  { value: "metacognition", label: "Metacognition" },
  { value: "emotionalControl", label: "Emotional Control" },
  { value: "flexibility", label: "Flexibility" },
];

const implementers: { value: EFIntervention["implementer"]; label: string }[] = [
  { value: "TEACHER", label: "Teacher" },
  { value: "STUDENT", label: "Student" },
  { value: "PARENT", label: "Parent" },
  { value: "TEAM", label: "Team" },
];

export default function InterventionsPage() {
  const params = useParams();
  const router = useRouter();
  const learnerId = (params?.learnerId as string) || "";

  const [interventions, setInterventions] = useState<EFIntervention[]>(mockInterventions);
  const [filterDomain, setFilterDomain] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New intervention form state
  const [newIntervention, setNewIntervention] = useState({
    efDomain: "" as EFDomain | "",
    strategy: "",
    description: "",
    implementer: "" as EFIntervention["implementer"] | "",
  });

  const handleAddIntervention = async (intervention: Partial<EFIntervention>) => {
    // TODO: API call
    const newItem: EFIntervention = {
      id: `intervention-${Date.now()}`,
      learnerId,
      efDomain: (intervention.efDomain || newIntervention.efDomain) as EFDomain,
      strategy: intervention.strategy || newIntervention.strategy,
      description: intervention.description || newIntervention.description,
      implementer: (intervention.implementer || newIntervention.implementer) as EFIntervention["implementer"],
      startDate: new Date().toISOString().split("T")[0],
      isActive: true,
      effectivenessRatings: [],
      aiSuggested: intervention.aiSuggested || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setInterventions((prev) => [newItem, ...prev]);
    setIsAddModalOpen(false);
    setNewIntervention({
      efDomain: "",
      strategy: "",
      description: "",
      implementer: "",
    });
  };

  const handleUpdateIntervention = async (id: string, updates: Partial<EFIntervention>) => {
    // TODO: API call
    setInterventions((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i
      )
    );
  };

  const handleRateEffectiveness = async (
    interventionId: string,
    rating: EffectivenessRating,
    notes?: string
  ) => {
    // TODO: API call
    setInterventions((prev) =>
      prev.map((i) =>
        i.id === interventionId
          ? {
              ...i,
              effectivenessRatings: [
                ...i.effectivenessRatings,
                { date: new Date().toISOString().split("T")[0], rating, notes },
              ],
              updatedAt: new Date().toISOString(),
            }
          : i
      )
    );
  };

  // Filter interventions
  const filteredInterventions = interventions.filter((intervention) => {
    if (filterStatus === "active" && !intervention.isActive) return false;
    if (filterStatus === "inactive" && intervention.isActive) return false;
    if (filterDomain !== "all" && intervention.efDomain !== filterDomain) return false;
    if (
      searchQuery &&
      !intervention.strategy.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !(intervention.description || "").toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  // Stats
  const activeCount = interventions.filter((i) => i.isActive).length;
  const avgEffectiveness = (() => {
    const allRatings = interventions.flatMap((i) => i.effectivenessRatings);
    if (allRatings.length === 0) return "N/A";
    const scores: Record<EffectivenessRating, number> = {
      VERY_EFFECTIVE: 4,
      EFFECTIVE: 3,
      SOMEWHAT_EFFECTIVE: 2,
      NOT_EFFECTIVE: 1,
    };
    const totalScore = allRatings.reduce((sum, r) => sum + scores[r.rating], 0);
    return (totalScore / allRatings.length).toFixed(1);
  })();
  const domainsCovered = new Set(interventions.filter((i) => i.isActive).map((i) => i.efDomain))
    .size;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">EF Interventions</h1>
            <p className="text-muted-foreground">
              Track and manage executive function strategies
            </p>
          </div>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Intervention
        </Button>
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Add New Intervention</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setIsAddModalOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>Create a new EF intervention strategy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Target Domain</label>
                <Select
                  value={newIntervention.efDomain}
                  onValueChange={(value) =>
                    setNewIntervention((prev) => ({ ...prev, efDomain: value as EFDomain }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select domain" />
                  </SelectTrigger>
                  <SelectContent>
                    {efDomains.map((domain) => (
                      <SelectItem key={domain.value} value={domain.value}>
                        {domain.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Strategy Name</label>
                <Input
                  value={newIntervention.strategy}
                  onChange={(e) =>
                    setNewIntervention((prev) => ({ ...prev, strategy: e.target.value }))
                  }
                  placeholder="e.g., Visual Timer, Task Launch Routine"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={newIntervention.description}
                  onChange={(e) =>
                    setNewIntervention((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Describe the intervention strategy in detail..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Implementer</label>
                <Select
                  value={newIntervention.implementer}
                  onValueChange={(value) =>
                    setNewIntervention((prev) => ({
                      ...prev,
                      implementer: value as EFIntervention["implementer"],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Who will implement?" />
                  </SelectTrigger>
                  <SelectContent>
                    {implementers.map((impl) => (
                      <SelectItem key={impl.value} value={impl.value}>
                        {impl.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => handleAddIntervention({})}
                  disabled={
                    !newIntervention.efDomain ||
                    !newIntervention.strategy ||
                    !newIntervention.implementer
                  }
                >
                  Add Intervention
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Interventions</CardDescription>
            <CardTitle className="text-3xl">{activeCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Currently in progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg. Effectiveness</CardDescription>
            <CardTitle className="text-3xl">{avgEffectiveness}/5</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Across all rated strategies</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Domains Covered</CardDescription>
            <CardTitle className="text-3xl">{domainsCovered}/8</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Active interventions by domain</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed</CardDescription>
            <CardTitle className="text-3xl">
              {interventions.filter((i) => !i.isActive).length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Finished interventions</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search interventions..."
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={filterDomain} onValueChange={setFilterDomain}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by domain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Domains</SelectItem>
                {efDomains.map((domain) => (
                  <SelectItem key={domain.value} value={domain.value}>
                    {domain.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Interventions List */}
      <EFInterventionTracker
        interventions={filteredInterventions}
        onAddIntervention={handleAddIntervention}
        onUpdateIntervention={handleUpdateIntervention}
        onRateEffectiveness={handleRateEffectiveness}
      />

      {filteredInterventions.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No interventions found matching your filters.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setFilterDomain("all");
                setFilterStatus("all");
                setSearchQuery("");
              }}
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
