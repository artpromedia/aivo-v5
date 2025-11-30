"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Brain, Save, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { AutismProfileSetup, CommunicationProfileForm } from "@/components/autism";

export default function AutismProfilePage() {
  const params = useParams();
  const router = useRouter();
  const learnerId = (params?.learnerId as string) || "";
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveProfile = async (profile: Record<string, unknown>) => {
    setIsSaving(true);
    try {
      await fetch(`/api/autism/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ learner_id: learnerId, ...profile }),
      });
      // Show success message
    } catch (error) {
      console.error("Failed to save profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCommunication = async (profile: Record<string, unknown>) => {
    setIsSaving(true);
    try {
      await fetch(`/api/autism/communication-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ learner_id: learnerId, ...profile }),
      });
    } catch (error) {
      console.error("Failed to save communication profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

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
            <Brain className="h-6 w-6 text-purple-600" />
            Autism Profile
          </h1>
          <p className="text-muted-foreground">
            Communication, sensory, and social interaction preferences
          </p>
        </div>
        <Button disabled={isSaving}>
          {isSaving ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save All
            </>
          )}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profile">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">Profile Setup</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
          <TabsTrigger value="sensory">Sensory Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <AutismProfileSetup
            learnerId={learnerId}
            onSave={handleSaveProfile}
          />
        </TabsContent>

        <TabsContent value="communication">
          <CommunicationProfileForm
            learnerId={learnerId}
            onSave={handleSaveCommunication}
          />
        </TabsContent>

        <TabsContent value="sensory">
          <Card>
            <CardHeader>
              <CardTitle>Sensory Profile</CardTitle>
              <CardDescription>
                Detailed sensory preferences and sensitivities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Sensory profile is linked from the existing SensoryProfile model.
                View and edit in the main learner profile.
              </p>
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/teacher/learners/${learnerId}`)}
                >
                  Go to Learner Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
