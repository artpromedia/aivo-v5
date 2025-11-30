"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { 
  BarChart3, 
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  MapPin,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { BehaviorIncident } from "./ABCDataEntry";

interface BehaviorPatternChartProps {
  incidents: BehaviorIncident[];
  dateRange?: { start: Date; end: Date };
  className?: string;
}

interface DailyData {
  date: string;
  count: number;
  incidents: BehaviorIncident[];
}

interface PatternData {
  name: string;
  count: number;
  percentage: number;
}

export function BehaviorPatternChart({
  incidents,
  dateRange,
  className,
}: BehaviorPatternChartProps) {
  // Filter incidents by date range
  const filteredIncidents = useMemo(() => {
    if (!dateRange) return incidents;
    return incidents.filter((i) => {
      const date = new Date(i.date);
      return date >= dateRange.start && date <= dateRange.end;
    });
  }, [incidents, dateRange]);

  // Calculate daily data
  const dailyData = useMemo(() => {
    const byDate: Record<string, BehaviorIncident[]> = {};
    filteredIncidents.forEach((i) => {
      if (!byDate[i.date]) byDate[i.date] = [];
      byDate[i.date].push(i);
    });

    const data: DailyData[] = Object.entries(byDate)
      .map(([date, incidents]) => ({ date, count: incidents.length, incidents }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return data;
  }, [filteredIncidents]);

  // Calculate patterns
  const patterns = useMemo(() => {
    const total = filteredIncidents.length;
    if (total === 0) return { time: [], location: [], antecedent: [], behavior: [] };

    const count = (key: keyof BehaviorIncident): PatternData[] => {
      const counts: Record<string, number> = {};
      filteredIncidents.forEach((i) => {
        const val = String(i[key] || "Unknown");
        counts[val] = (counts[val] || 0) + 1;
      });
      return Object.entries(counts)
        .map(([name, count]) => ({ name, count, percentage: (count / total) * 100 }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    };

    // Time of day patterns
    const timePatterns: PatternData[] = (() => {
      const periods: Record<string, number> = {
        "Morning (6-9am)": 0,
        "Mid-Morning (9-12pm)": 0,
        "Afternoon (12-3pm)": 0,
        "Late Afternoon (3-6pm)": 0,
        "Evening (6pm+)": 0,
      };
      filteredIncidents.forEach((i) => {
        const hour = parseInt(i.time?.split(":")[0] || "12");
        if (hour >= 6 && hour < 9) periods["Morning (6-9am)"]++;
        else if (hour >= 9 && hour < 12) periods["Mid-Morning (9-12pm)"]++;
        else if (hour >= 12 && hour < 15) periods["Afternoon (12-3pm)"]++;
        else if (hour >= 15 && hour < 18) periods["Late Afternoon (3-6pm)"]++;
        else periods["Evening (6pm+)"]++;
      });
      return Object.entries(periods)
        .map(([name, count]) => ({ name, count, percentage: (count / total) * 100 }))
        .filter((p) => p.count > 0);
    })();

    return {
      time: timePatterns,
      location: count("location"),
      antecedent: count("antecedentCategory"),
      behavior: count("behavior"),
    };
  }, [filteredIncidents]);

  // Calculate trend
  const trend = useMemo(() => {
    if (dailyData.length < 2) return { direction: "stable", percentage: 0 };
    
    const midpoint = Math.floor(dailyData.length / 2);
    const firstHalf = dailyData.slice(0, midpoint);
    const secondHalf = dailyData.slice(midpoint);
    
    const firstAvg = firstHalf.reduce((sum, d) => sum + d.count, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, d) => sum + d.count, 0) / secondHalf.length;
    
    const change = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;
    
    return {
      direction: change > 10 ? "up" : change < -10 ? "down" : "stable",
      percentage: Math.abs(change),
    };
  }, [dailyData]);

  const maxCount = Math.max(...dailyData.map((d) => d.count), 1);

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Behavior Pattern Analysis
        </CardTitle>
        <CardDescription>
          {filteredIncidents.length} incidents recorded
          {dateRange && ` from ${dateRange.start.toLocaleDateString()} to ${dateRange.end.toLocaleDateString()}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {filteredIncidents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No incidents recorded in this time period
          </div>
        ) : (
          <>
            {/* Trend Summary */}
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              <div className={cn(
                "p-3 rounded-full",
                trend.direction === "up" && "bg-red-100 dark:bg-red-900",
                trend.direction === "down" && "bg-green-100 dark:bg-green-900",
                trend.direction === "stable" && "bg-gray-100 dark:bg-gray-800"
              )}>
                {trend.direction === "up" && <TrendingUp className="h-6 w-6 text-red-600" />}
                {trend.direction === "down" && <TrendingDown className="h-6 w-6 text-green-600" />}
                {trend.direction === "stable" && <Minus className="h-6 w-6 text-gray-600" />}
              </div>
              <div>
                <div className="font-semibold">
                  {trend.direction === "up" && `Increasing by ${trend.percentage.toFixed(0)}%`}
                  {trend.direction === "down" && `Decreasing by ${trend.percentage.toFixed(0)}%`}
                  {trend.direction === "stable" && "Stable pattern"}
                </div>
                <div className="text-sm text-muted-foreground">
                  Comparing first half to second half of period
                </div>
              </div>
            </div>

            {/* Daily Chart */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Daily Frequency
              </h4>
              <div className="flex items-end gap-1 h-32 pt-4">
                {dailyData.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center group">
                    <div className="relative w-full">
                      <div
                        className="w-full bg-primary rounded-t transition-all hover:bg-primary/80"
                        style={{ height: `${(d.count / maxCount) * 100}px` }}
                      />
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Badge variant="secondary" className="text-xs">
                          {d.count}
                        </Badge>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground mt-1 truncate w-full text-center">
                      {new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pattern Grids */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Time Patterns */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Time of Day
                </h4>
                <div className="space-y-2">
                  {patterns.time.map((p, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-24 text-sm truncate">{p.name}</div>
                      <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${p.percentage}%` }}
                        />
                      </div>
                      <div className="w-8 text-sm text-right">{p.count}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Location Patterns */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  Location
                </h4>
                <div className="space-y-2">
                  {patterns.location.map((p, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-24 text-sm truncate capitalize">{p.name}</div>
                      <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${p.percentage}%` }}
                        />
                      </div>
                      <div className="w-8 text-sm text-right">{p.count}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Antecedent Patterns */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Top Antecedents</h4>
                <div className="space-y-2">
                  {patterns.antecedent.map((p, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-24 text-sm truncate capitalize">{p.name}</div>
                      <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-orange-500 rounded-full"
                          style={{ width: `${p.percentage}%` }}
                        />
                      </div>
                      <div className="w-8 text-sm text-right">{p.count}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Behavior Patterns */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Top Behaviors</h4>
                <div className="space-y-2">
                  {patterns.behavior.map((p, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-24 text-sm truncate capitalize">{p.name}</div>
                      <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-500 rounded-full"
                          style={{ width: `${p.percentage}%` }}
                        />
                      </div>
                      <div className="w-8 text-sm text-right">{p.count}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
