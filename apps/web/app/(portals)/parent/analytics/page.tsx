'use client'

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  RadialLinearScale
} from "chart.js";
import { Line, Radar } from "react-chartjs-2";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import { ExportButton } from "@/components/ui/ExportButton";
import { KPICard } from "@/components/analytics/KPICard";
import { DomainAnalysisTabs } from "@/components/analytics/DomainAnalysisTabs";
import { IEPGoalsTracker } from "@/components/analytics/IEPGoalsTracker";
import { StatusBadge } from "@/components/ui/StatusBadge";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend, RadialLinearScale);

const DOMAINS = ["READING", "MATH", "SPEECH", "SEL", "SCIENCE"] as const;

type LearnerSnapshot = {
  id: string;
  firstName: string;
  lastName: string;
  gradeLevel: number;
};

type Trend = { improvement: number; struggling: boolean; daysStruggling: number };

type PredictionMap = Record<
  string,
  {
    currentLevel?: number;
    predictedLevel30Days?: number;
    predictedLevel90Days?: number;
    confidence?: number;
    recommendedIntervention?: string;
  }
>;

type BenchmarkResponse = {
  current?: Record<string, number>;
  neurotypical?: Record<string, number>;
  neurodiverse?: Record<string, number>;
  comparison?: Record<string, { vsNeurotypical: string; vsNeurodiverse: string; performance: string }>;
} | null;

interface AnalyticsResponse {
  current: Record<string, number>;
  trends: Record<string, Trend>;
  dates: string[];
  overallProgress: number[];
  predicted: number[];
  alerts: { domain: string; severity: string; days: number }[];
  timeline: { date: string; domains: Record<string, number> }[];
}

export default function AnalyticsDashboard() {
  const [learners, setLearners] = useState<LearnerSnapshot[]>([]);
  const [selectedLearnerId, setSelectedLearnerId] = useState<string>("");
  const [dateRange, setDateRange] = useState<{ start: string | null; end: string | null }>({ start: null, end: null });
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [predictions, setPredictions] = useState<PredictionMap | null>(null);
  const [benchmarks, setBenchmarks] = useState<BenchmarkResponse>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [loadingLearners, setLoadingLearners] = useState(true);

  const selectedLearner = useMemo(() => learners.find((learner) => learner.id === selectedLearnerId) ?? null, [learners, selectedLearnerId]);

  useEffect(() => {
    const loadLearners = async () => {
      setLoadingLearners(true);
      try {
        const response = await fetch("/api/dashboards/parent");
        const data = await response.json();
        setLearners(data.learners ?? []);
        if (data.learners?.length) {
          setSelectedLearnerId(data.learners[0].id);
        }
      } catch (error) {
        console.error(error);
        setLearners([]);
      } finally {
        setLoadingLearners(false);
      }
    };

    void loadLearners();
  }, []);

  const loadAnalytics = useCallback(async () => {
    if (!selectedLearnerId) return;
    setLoadingAnalytics(true);
    const params = new URLSearchParams({ learnerId: selectedLearnerId });
    if (dateRange.start) params.append("start", dateRange.start);
    if (dateRange.end) params.append("end", dateRange.end);

    try {
      const [analyticsRes, predictionsRes, benchmarksRes] = await Promise.all([
        fetch(`/api/analytics/progress?${params.toString()}`),
        fetch(`/api/analytics/predictions?learnerId=${selectedLearnerId}`),
        fetch(`/api/analytics/benchmarks?learnerId=${selectedLearnerId}`)
      ]);

      setAnalytics(await analyticsRes.json());
      setPredictions(await predictionsRes.json());
      setBenchmarks(await benchmarksRes.json());
    } catch (error) {
      console.error(error);
      setAnalytics(null);
      setPredictions(null);
      setBenchmarks(null);
    } finally {
      setLoadingAnalytics(false);
    }
  }, [dateRange.end, dateRange.start, selectedLearnerId]);

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Learning analytics</h1>
            <p className="text-gray-600">Comprehensive progress tracking for {selectedLearner?.firstName ?? "your learner"}</p>
          </div>
          <div className="flex items-center gap-3">
            <DateRangePicker onChange={setDateRange} />
            <ExportButton data={analytics} filename="learning-report" />
          </div>
        </header>

        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Learner</p>
            <select
              className="mt-1 w-64 rounded-xl border border-slate-200 px-4 py-2 text-base shadow-sm"
              value={selectedLearnerId}
              onChange={(event) => setSelectedLearnerId(event.target.value)}
              disabled={loadingLearners || !learners.length}
            >
              {learners.map((learner) => (
                <option key={learner.id} value={learner.id}>
                  {learner.firstName} {learner.lastName}
                </option>
              ))}
            </select>
          </div>
          {loadingAnalytics && <StatusBadge status="INFO" label="Refreshing insights" />}
        </div>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-5">
          {DOMAINS.map((domain) => (
            <KPICard
              key={domain}
              domain={domain}
              current={analytics?.current?.[domain]}
              trend={analytics?.trends?.[domain]}
              prediction={predictions?.[domain]}
            />
          ))}
        </section>

        <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title="Progress trajectory" subtitle="Real-time mastery vs projection" />
            <CardContent>
              <Line
                data={{
                  labels: analytics?.dates ?? [],
                  datasets: [
                    {
                      label: "Overall progress",
                      data: analytics?.overallProgress ?? [],
                      borderColor: "rgb(99, 102, 241)",
                      backgroundColor: "rgba(99, 102, 241, 0.2)",
                      tension: 0.4,
                      fill: true
                    },
                    {
                      label: "Predicted",
                      data: analytics?.predicted ?? [],
                      borderColor: "rgb(234, 179, 8)",
                      borderDash: [5, 5],
                      tension: 0.4
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  plugins: { legend: { display: true }, tooltip: { mode: "index" } },
                  scales: { y: { beginAtZero: true, max: 100 } }
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Domain comparison" subtitle="Neurotypical vs neurodiverse" />
            <CardContent>
              <Radar
                data={{
                  labels: DOMAINS.map((domain) => domain.toLowerCase()),
                  datasets: [
                    {
                      label: selectedLearner?.firstName ?? "Learner",
                      data: DOMAINS.map((domain) => analytics?.current?.[domain] ?? 0),
                      backgroundColor: "rgba(99,102,241,0.2)",
                      borderColor: "rgb(99,102,241)",
                      pointBackgroundColor: "rgb(99,102,241)"
                    },
                    {
                      label: "Neurotypical avg",
                      data: DOMAINS.map((domain) => benchmarks?.neurotypical?.[domain] ?? 0),
                      backgroundColor: "rgba(34,197,94,0.2)",
                      borderColor: "rgb(34,197,94)",
                      pointBackgroundColor: "rgb(34,197,94)"
                    },
                    {
                      label: "Neurodiverse avg",
                      data: DOMAINS.map((domain) => benchmarks?.neurodiverse?.[domain] ?? 0),
                      backgroundColor: "rgba(251,146,60,0.2)",
                      borderColor: "rgb(251,146,60)",
                      pointBackgroundColor: "rgb(251,146,60)"
                    }
                  ]
                }}
                options={{ responsive: true, scales: { r: { beginAtZero: true, max: 100 } } }}
              />
            </CardContent>
          </Card>
        </section>

        <Card className="mt-8">
          <CardHeader title="Domain deep dive" subtitle="Actionable insights per subject" />
          <CardContent>
            <DomainAnalysisTabs analytics={analytics} predictions={predictions} benchmarks={benchmarks} />
          </CardContent>
        </Card>

        <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title="Alerts & milestones" subtitle="Realtime focus from AI" />
            <CardContent>
              {analytics?.alerts?.length ? (
                <ul className="space-y-3">
                  {analytics.alerts.map((alert) => (
                    <li key={alert.domain} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{alert.domain}</p>
                        <p className="text-xs text-slate-500">{alert.days} days below target</p>
                      </div>
                      <StatusBadge status={alert.severity === "HIGH" ? "ALERT" : "INFO"} label={alert.severity} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">No alerts — keep up the positive momentum!</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="IEP goals progress" subtitle="Track commitments at a glance" />
            <CardContent>
              <IEPGoalsTracker learnerId={selectedLearnerId} />
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
