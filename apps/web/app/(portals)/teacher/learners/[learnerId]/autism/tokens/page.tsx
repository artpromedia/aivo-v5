"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Star, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { TokenBoardInteractive, type TokenBoard } from "@/components/autism";

export default function TokenBoardsPage() {
  const params = useParams();
  const router = useRouter();
  const learnerId = (params?.learnerId as string) || "";
  const [boards, setBoards] = useState<TokenBoard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [activeBoard, setActiveBoard] = useState<TokenBoard | undefined>();
  const [newBoard, setNewBoard] = useState<Partial<TokenBoard>>({
    name: "",
    targetBehavior: "",
    tokensRequired: 5,
    currentTokens: 0,
    tokenIcon: "star",
    reward: "",
    isActive: true,
  });

  useEffect(() => {
    loadBoards();
  }, [learnerId]);

  const loadBoards = async () => {
    try {
      const response = await fetch(`/api/autism/token-boards?learner_id=${learnerId}`);
      if (response.ok) {
        const data = await response.json();
        setBoards(data);
      }
    } catch (error) {
      console.error("Failed to load token boards:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await fetch(`/api/autism/token-boards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newBoard, learner_id: learnerId }),
      });
      await loadBoards();
      setShowCreate(false);
      setNewBoard({
        name: "",
        targetBehavior: "",
        tokensRequired: 5,
        currentTokens: 0,
        tokenIcon: "star",
        reward: "",
        isActive: true,
      });
    } catch (error) {
      console.error("Failed to create board:", error);
    }
  };

  const handleTokenChange = async (boardId: string, newCount: number) => {
    try {
      await fetch(`/api/autism/token-boards/${boardId}/tokens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_tokens: newCount }),
      });
      await loadBoards();
    } catch (error) {
      console.error("Failed to update tokens:", error);
    }
  };

  const handleReset = async (boardId: string) => {
    try {
      await fetch(`/api/autism/token-boards/${boardId}/tokens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_tokens: 0 }),
      });
      await loadBoards();
    } catch (error) {
      console.error("Failed to reset board:", error);
    }
  };

  if (activeBoard) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => setActiveBoard(undefined)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Boards
          </Button>
        </div>
        <TokenBoardInteractive
          board={activeBoard}
          onTokenChange={(count: number) => handleTokenChange(activeBoard.id || "", count)}
          onReset={() => handleReset(activeBoard.id || "")}
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
            <Star className="h-6 w-6 text-yellow-600" />
            Token Economy
          </h1>
          <p className="text-muted-foreground">
            Interactive token boards for reinforcement
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Board
        </Button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create Token Board</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Board Name</label>
                <Input
                  value={newBoard.name}
                  onChange={(e) => setNewBoard({ ...newBoard, name: e.target.value })}
                  placeholder="e.g., Morning Routine Board"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Target Behavior</label>
                <Input
                  value={newBoard.targetBehavior}
                  onChange={(e) => setNewBoard({ ...newBoard, targetBehavior: e.target.value })}
                  placeholder="e.g., Following directions"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tokens Required</label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={newBoard.tokensRequired}
                  onChange={(e) => setNewBoard({ ...newBoard, tokensRequired: parseInt(e.target.value) || 5 })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Reward</label>
                <Input
                  value={newBoard.reward}
                  onChange={(e) => setNewBoard({ ...newBoard, reward: e.target.value })}
                  placeholder="e.g., 5 minutes iPad time"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Token Icon</label>
              <div className="flex gap-2">
                {["star", "sparkle", "trophy", "gift"].map((icon) => (
                  <Button
                    key={icon}
                    variant={newBoard.tokenIcon === icon ? "default" : "outline"}
                    size="sm"
                    onClick={() => setNewBoard({ ...newBoard, tokenIcon: icon })}
                  >
                    {icon}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreate}
                disabled={!newBoard.name || !newBoard.targetBehavior || !newBoard.reward}
              >
                Create Board
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Boards Grid */}
      {isLoading ? (
        <div className="text-center py-12">Loading...</div>
      ) : boards.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Token Boards Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create token boards to reinforce positive behaviors.
            </p>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Board
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards.map((board) => (
            <div 
              key={board.id}
              className="cursor-pointer"
              onClick={() => setActiveBoard(board)}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{board.name}</CardTitle>
                    {board.isActive && <Badge className="bg-green-600">Active</Badge>}
                  </div>
                  <CardDescription>{board.targetBehavior}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex gap-1">
                      {Array.from({ length: board.tokensRequired }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            i < board.currentTokens
                              ? "bg-yellow-100 dark:bg-yellow-900"
                              : "bg-gray-100 dark:bg-gray-800"
                          }`}
                        >
                          {i < board.currentTokens && (
                            <Star className="h-5 w-5 text-yellow-500" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Reward: {board.reward}
                  </div>
                  <div className="mt-2">
                    <Badge variant="outline">
                      {board.currentTokens} / {board.tokensRequired}
                    </Badge>
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
