/**
 * Model Monitor
 * 
 * Real-time monitoring of ML model performance in production.
 * Tracks decision quality, confidence calibration, and outcomes.
 */

import type { LearningContext, LearningDecision } from "../PersonalizedLearningAgent";
import type { PrismaClient } from "@prisma/client";
import { EventEmitter } from "events";

export interface MonitoringMetrics {
	timestamp: Date;
	totalDecisions: number;
	mlDecisions: number;
	gpt4Decisions: number;
	mlUsageRate: number;
	avgConfidence: number;
	actionDistribution: Record<string, number>;
	avgOutcomeAccuracy: number;
	avgOutcomeEngagement: number;
	errorRate: number;
	latency: {
		ml: number;
		gpt4: number;
	};
}

export interface DecisionLog {
	id: string;
	learnerId: string;
	timestamp: Date;
	source: "ml" | "gpt4";
	action: string;
	confidence: number;
	context: LearningContext;
	decision: LearningDecision;
	latencyMs: number;
	outcome?: {
		nextAccuracy: number;
		nextEngagement: number;
		wasSuccessful: boolean;
	};
}

export interface Alert {
	severity: "info" | "warning" | "critical";
	message: string;
	metric: string;
	value: number;
	threshold: number;
	timestamp: Date;
}

export class ModelMonitor extends EventEmitter {
	private prisma: PrismaClient;
	private decisionLogs: DecisionLog[] = [];
	private alerts: Alert[] = [];
	private metrics: MonitoringMetrics;
	private readonly maxLogSize = 10000;
	
	// Alert thresholds
	private readonly thresholds = {
		minMLUsageRate: 0.5, // 50% of decisions should use ML
		minConfidence: 0.6, // Average confidence should be > 60%
		maxErrorRate: 0.05, // < 5% errors
		minAccuracy: 0.7, // Outcome accuracy > 70%
		minEngagement: 0.6, // Outcome engagement > 60%
		maxLatency: 1000 // < 1 second
	};

	constructor(prisma: PrismaClient) {
		super();
		this.prisma = prisma;
		this.metrics = this.initializeMetrics();
	}

	private initializeMetrics(): MonitoringMetrics {
		return {
			timestamp: new Date(),
			totalDecisions: 0,
			mlDecisions: 0,
			gpt4Decisions: 0,
			mlUsageRate: 0,
			avgConfidence: 0,
			actionDistribution: {},
			avgOutcomeAccuracy: 0,
			avgOutcomeEngagement: 0,
			errorRate: 0,
			latency: { ml: 0, gpt4: 0 }
		};
	}

	/**
	 * Log a decision made by the agent
	 */
	logDecision(
		learnerId: string,
		source: "ml" | "gpt4",
		decision: LearningDecision,
		context: LearningContext,
		latencyMs: number
	): string {
		const log: DecisionLog = {
			id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			learnerId,
			timestamp: new Date(),
			source,
			action: decision.action,
			confidence: decision.confidence,
			context,
			decision,
			latencyMs
		};

		this.decisionLogs.push(log);

		// Trim logs if needed
		if (this.decisionLogs.length > this.maxLogSize) {
			this.decisionLogs = this.decisionLogs.slice(-this.maxLogSize);
		}

		// Update metrics
		this.updateMetrics();

		// Check for alerts
		this.checkAlerts();

		// Emit event
		this.emit("decision", log);

		return log.id;
	}

	/**
	 * Record outcome of a decision
	 */
	recordOutcome(
		decisionId: string,
		outcome: { nextAccuracy: number; nextEngagement: number; wasSuccessful: boolean }
	): void {
		const log = this.decisionLogs.find(l => l.id === decisionId);
		if (!log) {
			console.warn(`Decision log not found: ${decisionId}`);
			return;
		}

		log.outcome = outcome;

		// Update metrics
		this.updateMetrics();

		// Emit event
		this.emit("outcome", { decisionId, outcome });
	}

	/**
	 * Update monitoring metrics
	 */
	private updateMetrics(): void {
		const recentLogs = this.decisionLogs.slice(-1000); // Last 1000 decisions

		this.metrics = {
			timestamp: new Date(),
			totalDecisions: recentLogs.length,
			mlDecisions: recentLogs.filter(l => l.source === "ml").length,
			gpt4Decisions: recentLogs.filter(l => l.source === "gpt4").length,
			mlUsageRate: recentLogs.length > 0
				? recentLogs.filter(l => l.source === "ml").length / recentLogs.length
				: 0,
			avgConfidence: recentLogs.length > 0
				? recentLogs.reduce((sum, l) => sum + l.confidence, 0) / recentLogs.length
				: 0,
			actionDistribution: this.calculateActionDistribution(recentLogs),
			avgOutcomeAccuracy: this.calculateAvgOutcome(recentLogs, "nextAccuracy"),
			avgOutcomeEngagement: this.calculateAvgOutcome(recentLogs, "nextEngagement"),
			errorRate: recentLogs.length > 0
				? recentLogs.filter(l => l.outcome && !l.outcome.wasSuccessful).length / recentLogs.length
				: 0,
			latency: {
				ml: this.calculateAvgLatency(recentLogs, "ml"),
				gpt4: this.calculateAvgLatency(recentLogs, "gpt4")
			}
		};
	}

	private calculateActionDistribution(logs: DecisionLog[]): Record<string, number> {
		const dist: Record<string, number> = {};
		logs.forEach(log => {
			dist[log.action] = (dist[log.action] || 0) + 1;
		});
		return dist;
	}

	private calculateAvgOutcome(logs: DecisionLog[], field: "nextAccuracy" | "nextEngagement"): number {
		const logsWithOutcome = logs.filter(l => l.outcome);
		if (logsWithOutcome.length === 0) return 0;
		return logsWithOutcome.reduce((sum, l) => sum + (l.outcome![field] || 0), 0) / logsWithOutcome.length;
	}

	private calculateAvgLatency(logs: DecisionLog[], source: "ml" | "gpt4"): number {
		const filtered = logs.filter(l => l.source === source);
		if (filtered.length === 0) return 0;
		return filtered.reduce((sum, l) => sum + l.latencyMs, 0) / filtered.length;
	}

	/**
	 * Check for alert conditions
	 */
	private checkAlerts(): void {
		// ML usage rate too low
		if (this.metrics.mlUsageRate < this.thresholds.minMLUsageRate) {
			this.createAlert(
				"warning",
				"ML usage rate below threshold",
				"mlUsageRate",
				this.metrics.mlUsageRate,
				this.thresholds.minMLUsageRate
			);
		}

		// Average confidence too low
		if (this.metrics.avgConfidence < this.thresholds.minConfidence) {
			this.createAlert(
				"warning",
				"Average confidence below threshold",
				"avgConfidence",
				this.metrics.avgConfidence,
				this.thresholds.minConfidence
			);
		}

		// Error rate too high
		if (this.metrics.errorRate > this.thresholds.maxErrorRate) {
			this.createAlert(
				"critical",
				"Error rate exceeds threshold",
				"errorRate",
				this.metrics.errorRate,
				this.thresholds.maxErrorRate
			);
		}

		// Outcome accuracy too low
		if (this.metrics.avgOutcomeAccuracy < this.thresholds.minAccuracy) {
			this.createAlert(
				"warning",
				"Outcome accuracy below threshold",
				"avgOutcomeAccuracy",
				this.metrics.avgOutcomeAccuracy,
				this.thresholds.minAccuracy
			);
		}

		// Latency too high
		if (this.metrics.latency.ml > this.thresholds.maxLatency) {
			this.createAlert(
				"warning",
				"ML latency exceeds threshold",
				"latency.ml",
				this.metrics.latency.ml,
				this.thresholds.maxLatency
			);
		}
	}

	private createAlert(
		severity: Alert["severity"],
		message: string,
		metric: string,
		value: number,
		threshold: number
	): void {
		const alert: Alert = {
			severity,
			message,
			metric,
			value,
			threshold,
			timestamp: new Date()
		};

		this.alerts.push(alert);
		this.emit("alert", alert);

		console.log(`[${severity.toUpperCase()}] ${message}: ${value.toFixed(2)} (threshold: ${threshold})`);
	}

	/**
	 * Get current metrics
	 */
	getMetrics(): MonitoringMetrics {
		return { ...this.metrics };
	}

	/**
	 * Get recent alerts
	 */
	getAlerts(limit: number = 50): Alert[] {
		return this.alerts.slice(-limit);
	}

	/**
	 * Get decision logs
	 */
	getDecisionLogs(options?: {
		learnerId?: string;
		source?: "ml" | "gpt4";
		startDate?: Date;
		endDate?: Date;
		limit?: number;
	}): DecisionLog[] {
		let logs = [...this.decisionLogs];

		if (options?.learnerId) {
			logs = logs.filter(l => l.learnerId === options.learnerId);
		}

		if (options?.source) {
			logs = logs.filter(l => l.source === options.source);
		}

		if (options?.startDate) {
			logs = logs.filter(l => l.timestamp >= options.startDate!);
		}

		if (options?.endDate) {
			logs = logs.filter(l => l.timestamp <= options.endDate!);
		}

		if (options?.limit) {
			logs = logs.slice(-options.limit);
		}

		return logs;
	}

	/**
	 * Generate monitoring report
	 */
	generateReport(): string {
		const report: string[] = [];

		report.push("=== Model Monitoring Report ===");
		report.push(`Generated: ${this.metrics.timestamp.toISOString()}\n`);

		report.push("=== Decision Statistics ===");
		report.push(`Total Decisions: ${this.metrics.totalDecisions}`);
		report.push(`ML Decisions: ${this.metrics.mlDecisions} (${(this.metrics.mlUsageRate * 100).toFixed(1)}%)`);
		report.push(`GPT-4 Decisions: ${this.metrics.gpt4Decisions} (${((1 - this.metrics.mlUsageRate) * 100).toFixed(1)}%)`);
		report.push(`Average Confidence: ${(this.metrics.avgConfidence * 100).toFixed(1)}%\n`);

		report.push("=== Action Distribution ===");
		Object.entries(this.metrics.actionDistribution)
			.sort(([, a], [, b]) => b - a)
			.forEach(([action, count]) => {
				const pct = (count / this.metrics.totalDecisions) * 100;
				report.push(`${action}: ${count} (${pct.toFixed(1)}%)`);
			});

		report.push("\n=== Outcome Metrics ===");
		report.push(`Average Accuracy: ${(this.metrics.avgOutcomeAccuracy * 100).toFixed(1)}%`);
		report.push(`Average Engagement: ${(this.metrics.avgOutcomeEngagement * 100).toFixed(1)}%`);
		report.push(`Error Rate: ${(this.metrics.errorRate * 100).toFixed(2)}%\n`);

		report.push("=== Performance ===");
		report.push(`ML Latency: ${this.metrics.latency.ml.toFixed(0)}ms`);
		report.push(`GPT-4 Latency: ${this.metrics.latency.gpt4.toFixed(0)}ms\n`);

		if (this.alerts.length > 0) {
			report.push("=== Recent Alerts ===");
			this.getAlerts(10).forEach(alert => {
				report.push(`[${alert.severity.toUpperCase()}] ${alert.message}`);
				report.push(`  ${alert.metric}: ${alert.value.toFixed(2)} (threshold: ${alert.threshold})`);
			});
		}

		return report.join("\n");
	}

	/**
	 * Save metrics to database
	 */
	async saveMetrics(): Promise<void> {
		try {
			await this.prisma.$executeRaw`
				INSERT INTO "MLMonitoringMetrics" (
					id,
					timestamp,
					metrics,
					created_at
				)
				VALUES (
					gen_random_uuid(),
					${this.metrics.timestamp},
					${JSON.stringify(this.metrics)}::jsonb,
					NOW()
				)
			`;
		} catch (error) {
			console.error("Failed to save metrics:", error);
		}
	}

	/**
	 * Clear old logs and alerts
	 */
	cleanup(daysToKeep: number = 7): void {
		const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
		
		this.decisionLogs = this.decisionLogs.filter(log => log.timestamp >= cutoffDate);
		this.alerts = this.alerts.filter(alert => alert.timestamp >= cutoffDate);
		
		console.log(`Cleaned up logs older than ${daysToKeep} days`);
	}
}

// Singleton instance
let monitorInstance: ModelMonitor | null = null;

export function getModelMonitor(prisma: PrismaClient): ModelMonitor {
	if (!monitorInstance) {
		monitorInstance = new ModelMonitor(prisma);
	}
	return monitorInstance;
}
