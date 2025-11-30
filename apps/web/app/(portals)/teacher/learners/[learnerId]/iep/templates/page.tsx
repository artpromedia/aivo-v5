"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Search, Target, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { GoalTemplateSelector } from "@/components/iep";

export default function IEPTemplatesPage() {
  const router = useRouter();
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleSelectTemplate = (template: any) => {
    // Could navigate to goal creation with template pre-filled
    console.log("Selected template:", template);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">IEP Goal Templates</h1>
            <p className="text-muted-foreground">
              Browse and manage reusable goal templates
            </p>
          </div>
        </div>

        <Button onClick={() => setShowCreateForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Template
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Template browser */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Goal Templates Library
              </CardTitle>
              <CardDescription>
                Select a template to use as a starting point for new IEP goals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GoalTemplateSelector onSelectTemplate={handleSelectTemplate} />
            </CardContent>
          </Card>
        </div>

        {/* Info sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>About Templates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p className="text-muted-foreground">
                Goal templates provide SMART-compliant frameworks that can be customized
                for individual students.
              </p>

              <div>
                <h4 className="font-medium mb-1">Placeholders</h4>
                <p className="text-muted-foreground">
                  Templates use placeholders like <code className="bg-primary/10 px-1 rounded">[Student]</code> and{" "}
                  <code className="bg-primary/10 px-1 rounded">[X]%</code> that you fill in when creating a goal.
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-1">System vs Custom</h4>
                <p className="text-muted-foreground">
                  System templates are provided by AIVO and regularly updated.
                  Custom templates are created by your organization.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SMART Goals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <span className="font-bold text-primary">S</span>
                <div>
                  <span className="font-medium">Specific</span>
                  <p className="text-muted-foreground">Clear, well-defined behavior</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-primary">M</span>
                <div>
                  <span className="font-medium">Measurable</span>
                  <p className="text-muted-foreground">Quantifiable criteria for success</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-primary">A</span>
                <div>
                  <span className="font-medium">Achievable</span>
                  <p className="text-muted-foreground">Realistic given current level</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-primary">R</span>
                <div>
                  <span className="font-medium">Relevant</span>
                  <p className="text-muted-foreground">Connected to student's needs</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-primary">T</span>
                <div>
                  <span className="font-medium">Time-bound</span>
                  <p className="text-muted-foreground">Clear timeline for completion</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
