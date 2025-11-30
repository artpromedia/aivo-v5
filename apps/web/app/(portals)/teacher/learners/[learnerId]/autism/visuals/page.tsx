"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Eye, Plus, Grid, List, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { VisualSupportBuilder, type VisualSupport } from "@/components/autism";

export default function VisualSupportsPage() {
  const params = useParams();
  const router = useRouter();
  const learnerId = (params?.learnerId as string) || "";
  const [supports, setSupports] = useState<VisualSupport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingSupport, setEditingSupport] = useState<VisualSupport | undefined>();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadSupports();
  }, [learnerId]);

  const loadSupports = async () => {
    try {
      const response = await fetch(`/api/autism/visual-supports?learner_id=${learnerId}`);
      if (response.ok) {
        const data = await response.json();
        setSupports(data);
      }
    } catch (error) {
      console.error("Failed to load visual supports:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (support: VisualSupport) => {
    try {
      const method = support.id ? "PUT" : "POST";
      const url = support.id ? `/api/autism/visual-supports/${support.id}` : `/api/autism/visual-supports`;
      
      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...support, learner_id: learnerId }),
      });
      
      await loadSupports();
      setShowBuilder(false);
      setEditingSupport(undefined);
    } catch (error) {
      console.error("Failed to save visual support:", error);
    }
  };

  const filteredSupports = supports.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (showBuilder) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => { setShowBuilder(false); setEditingSupport(undefined); }}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Library
          </Button>
        </div>
        <VisualSupportBuilder
          learnerId={learnerId}
          support={editingSupport}
          onSave={handleSave}
          onCancel={() => { setShowBuilder(false); setEditingSupport(undefined); }}
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
            <Eye className="h-6 w-6 text-blue-600" />
            Visual Supports Library
          </h1>
          <p className="text-muted-foreground">
            Visual support cards and materials for this learner
          </p>
        </div>
        <Button onClick={() => setShowBuilder(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Visual
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search visuals..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-1 border rounded-lg p-1">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="text-center py-12">Loading...</div>
      ) : filteredSupports.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Eye className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Visual Supports Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create visual support cards to help with routines, choices, and communication.
            </p>
            <Button onClick={() => setShowBuilder(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Visual
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredSupports.map((support) => (
            <div
              key={support.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => { setEditingSupport(support); setShowBuilder(true); }}
            >
              <Card>
                <div className="aspect-square bg-muted rounded-t-lg flex items-center justify-center overflow-hidden">
                  {support.imageUrl ? (
                    <img src={support.imageUrl} alt={support.title} className="w-full h-full object-cover" />
                  ) : (
                    <Eye className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>
                <CardContent className="p-3">
                  <h4 className="font-semibold truncate">{support.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">{support.type}</Badge>
                    {support.category && (
                      <Badge variant="outline" className="text-xs">{support.category}</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredSupports.map((support) => (
            <div
              key={support.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => { setEditingSupport(support); setShowBuilder(true); }}
            >
              <Card>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                    {support.imageUrl ? (
                      <img src={support.imageUrl} alt={support.title} className="w-full h-full object-cover" />
                    ) : (
                      <Eye className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold">{support.title}</h4>
                    <p className="text-sm text-muted-foreground truncate">{support.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline">{support.type}</Badge>
                    {support.category && <Badge variant="outline">{support.category}</Badge>}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
