"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, Plus, Sparkles, Eye } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { 
  SocialStoryEditor, 
  SocialStoryViewer, 
  SocialStoryGenerator,
  type SocialStory 
} from "@/components/autism";

export default function SocialStoriesPage() {
  const params = useParams();
  const router = useRouter();
  const learnerId = (params?.learnerId as string) || "";
  const [stories, setStories] = useState<SocialStory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mode, setMode] = useState<"list" | "edit" | "view" | "generate">("list");
  const [currentStory, setCurrentStory] = useState<SocialStory | undefined>();

  useEffect(() => {
    loadStories();
  }, [learnerId]);

  const loadStories = async () => {
    try {
      const response = await fetch(`/api/autism/social-stories?learner_id=${learnerId}`);
      if (response.ok) {
        const data = await response.json();
        setStories(data);
      }
    } catch (error) {
      console.error("Failed to load stories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (story: SocialStory) => {
    try {
      const method = story.id ? "PUT" : "POST";
      const url = story.id ? `/api/autism/social-stories/${story.id}` : `/api/autism/social-stories`;
      
      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...story, learner_id: learnerId }),
      });
      
      await loadStories();
      setMode("list");
      setCurrentStory(undefined);
    } catch (error) {
      console.error("Failed to save story:", error);
    }
  };

  const handleStoryGenerated = (story: Partial<SocialStory>) => {
    setCurrentStory(story as SocialStory);
    setMode("edit");
  };

  const handleComplete = () => {
    setMode("list");
    setCurrentStory(undefined);
  };

  if (mode === "edit") {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => { setMode("list"); setCurrentStory(undefined); }}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Stories
          </Button>
        </div>
        <SocialStoryEditor
          learnerId={learnerId}
          story={currentStory}
          onSave={handleSave}
          onCancel={() => { setMode("list"); setCurrentStory(undefined); }}
        />
      </div>
    );
  }

  if (mode === "view" && currentStory) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => { setMode("list"); setCurrentStory(undefined); }}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Stories
          </Button>
          <div className="flex-1" />
          <Button variant="outline" onClick={() => setMode("edit")}>
            Edit Story
          </Button>
        </div>
        <SocialStoryViewer story={currentStory} onComplete={handleComplete} />
      </div>
    );
  }

  if (mode === "generate") {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => setMode("list")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Stories
          </Button>
        </div>
        <SocialStoryGenerator
          learnerId={learnerId}
          onStoryGenerated={handleStoryGenerated}
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
            <BookOpen className="h-6 w-6 text-orange-600" />
            Social Stories
          </h1>
          <p className="text-muted-foreground">
            Create and view social stories
          </p>
        </div>
        <Button variant="outline" onClick={() => setMode("generate")}>
          <Sparkles className="h-4 w-4 mr-2" />
          AI Generate
        </Button>
        <Button onClick={() => setMode("edit")}>
          <Plus className="h-4 w-4 mr-2" />
          Create Story
        </Button>
      </div>

      {/* Content */}
      <Tabs defaultValue="all">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Stories</TabsTrigger>
          <TabsTrigger value="published">Published</TabsTrigger>
          <TabsTrigger value="drafts">Drafts</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {isLoading ? (
            <div className="text-center py-12">Loading...</div>
          ) : stories.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Social Stories Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create social stories to help explain social situations and expectations.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" onClick={() => setMode("generate")}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate with AI
                  </Button>
                  <Button onClick={() => setMode("edit")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Manually
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stories.map((story) => (
                <div key={story.id}>
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{story.title}</CardTitle>
                        <Badge variant={story.targetBehavior ? "default" : "outline"}>
                          {story.targetBehavior || "General"}
                        </Badge>
                      </div>
                      <CardDescription>
                        {story.sentences?.length || 0} sentences • {story.topic}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => { setCurrentStory(story); setMode("view"); }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => { setCurrentStory(story); setMode("edit"); }}
                        >
                          Edit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="published">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stories.filter((s) => s.targetBehavior).map((story) => (
              <div key={story.id}>
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{story.title}</CardTitle>
                    <CardDescription>{story.sentences?.length || 0} sentences</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => { setCurrentStory(story); setMode("view"); }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Story
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="drafts">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stories.filter((s) => !s.targetBehavior).map((story) => (
              <div key={story.id}>
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{story.title}</CardTitle>
                    <CardDescription>{story.sentences?.length || 0} sentences</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => { setCurrentStory(story); setMode("edit"); }}
                    >
                      Continue Editing
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
