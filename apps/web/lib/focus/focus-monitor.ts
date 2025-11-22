import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";

interface TrackerListener {
  (payload?: unknown): void;
}

class Tracker {
  private listeners: Record<string, Set<TrackerListener>> = {};

  on(event: string, listener: TrackerListener) {
    if (!this.listeners[event]) {
      this.listeners[event] = new Set();
    }
    this.listeners[event]?.add(listener);
  }

  off(event: string, listener: TrackerListener) {
    this.listeners[event]?.delete(listener);
  }

  protected emit(event: string, payload?: unknown) {
    this.listeners[event]?.forEach((listener) => listener(payload));
  }
}

class MouseTracker extends Tracker {
  private lastPoint: { x: number; y: number; time: number } | null = null;
  private handler = (event: MouseEvent) => {
    const current = { x: event.clientX, y: event.clientY, time: performance.now() };
    if (this.lastPoint) {
      const dx = current.x - this.lastPoint.x;
      const dy = current.y - this.lastPoint.y;
      const dt = current.time - this.lastPoint.time || 1;
      const velocity = Math.sqrt(dx ** 2 + dy ** 2) / dt;
      if (velocity > 1.8) {
        this.emit("erratic");
      }
    }
    this.lastPoint = current;
    this.emit("activity");
  };

  start() {
    if (typeof window === "undefined") return;
    window.addEventListener("mousemove", this.handler, { passive: true });
  }

  stop() {
    if (typeof window === "undefined") return;
    window.removeEventListener("mousemove", this.handler);
  }
}

class KeyboardTracker extends Tracker {
  private lastEventTime = Date.now();
  private idleInterval: number | null = null;

  private handleKeydown = () => {
    this.lastEventTime = Date.now();
    this.emit("activity");
  };

  start() {
    if (typeof window === "undefined") return;
    window.addEventListener("keydown", this.handleKeydown);
    this.idleInterval = window.setInterval(() => {
      const idleSeconds = (Date.now() - this.lastEventTime) / 1000;
      this.emit("idle", idleSeconds);
    }, 1000);
  }

  stop() {
    if (typeof window === "undefined") return;
    window.removeEventListener("keydown", this.handleKeydown);
    if (this.idleInterval) {
      clearInterval(this.idleInterval);
      this.idleInterval = null;
    }
  }
}

class ScrollTracker extends Tracker {
  private lastEventTime = Date.now();
  private idleInterval: number | null = null;
  private lastScrollY = 0;

  private handleScroll = () => {
    const currentY = window.scrollY;
    const delta = Math.abs(currentY - this.lastScrollY);
    if (delta > 300) {
      this.emit("rapid");
    }
    this.lastScrollY = currentY;
    this.lastEventTime = Date.now();
    this.emit("activity");
  };

  start() {
    if (typeof window === "undefined") return;
    this.lastScrollY = window.scrollY;
    window.addEventListener("scroll", this.handleScroll, { passive: true });
    this.idleInterval = window.setInterval(() => {
      const idleSeconds = (Date.now() - this.lastEventTime) / 1000;
      this.emit("idle", idleSeconds);
    }, 1000);
  }

  stop() {
    if (typeof window === "undefined") return;
    window.removeEventListener("scroll", this.handleScroll);
    if (this.idleInterval) {
      clearInterval(this.idleInterval);
      this.idleInterval = null;
    }
  }
}

export interface FocusConfig {
  idleThreshold: number;
  distractionThreshold: number;
  checkIntervalMs?: number;
  learnerId?: string | null;
  onLog?: (entry: DistractionLog) => void;
}

export interface DistractionLog {
  type: string;
  timestamp: Date;
  focusScore: number;
  sessionTime: number;
}

export interface FocusMonitorMetrics {
  focusScore: number;
  distractionCount: number;
  sessionDuration: number;
  lastActivity: Date;
}

export type FocusMetrics = FocusMonitorMetrics;

export class FocusMonitor {
  private isMonitoring = false;
  private lastActivity: Date = new Date();
  private distractionCount = 0;
  private focusScore = 100;
  private sessionStart: Date = new Date();
  private mouseTracker: MouseTracker;
  private keyboardTracker: KeyboardTracker;
  private scrollTracker: ScrollTracker;
  private engagementInterval: number | null = null;
  private focusCheckInterval: number | null = null;
  private lastScrollY = 0;
  private scrollIdleSeconds = 0;
  private onDistractionCallback: (() => void) | null = null;

  constructor(private config: FocusConfig) {
    this.mouseTracker = new MouseTracker();
    this.keyboardTracker = new KeyboardTracker();
    this.scrollTracker = new ScrollTracker();
  }

  startMonitoring(onDistraction: () => void) {
    if (this.isMonitoring || typeof window === "undefined") return;
    this.isMonitoring = true;
    this.sessionStart = new Date();
    this.lastActivity = new Date();
    this.onDistractionCallback = onDistraction;

    this.mouseTracker.on("activity", this.handleActivity);
    this.mouseTracker.on("erratic", () => this.handlePotentialDistraction("erratic_mouse"));
    this.mouseTracker.start();

    this.keyboardTracker.on("activity", this.handleActivity);
    this.keyboardTracker.on("idle", (duration) => {
      if (typeof duration === "number" && duration > this.config.idleThreshold) {
        this.handlePotentialDistraction("keyboard_idle");
      }
    });
    this.keyboardTracker.start();

    this.scrollTracker.on("activity", this.handleActivity);
    this.scrollTracker.on("idle", (duration) => {
      if (typeof duration === "number" && duration > this.config.idleThreshold) {
        this.handlePotentialDistraction("scroll_idle");
      }
    });
    this.scrollTracker.on("rapid", () => this.handlePotentialDistraction("rapid_scroll"));
    this.scrollTracker.start();

    document.addEventListener("visibilitychange", this.visibilityListener);

    this.lastScrollY = window.scrollY;
    this.engagementInterval = window.setInterval(() => this.trackEngagement(), 1000);
    this.focusCheckInterval = window.setInterval(() => this.checkFocusScore(), this.config.checkIntervalMs ?? 1000);
  }

  stopMonitoring() {
    if (!this.isMonitoring) return;
    this.isMonitoring = false;

    this.mouseTracker.stop();
    this.keyboardTracker.stop();
    this.scrollTracker.stop();

    this.mouseTracker = new MouseTracker();
    this.keyboardTracker = new KeyboardTracker();
    this.scrollTracker = new ScrollTracker();

    document.removeEventListener("visibilitychange", this.visibilityListener);

    if (this.engagementInterval) {
      clearInterval(this.engagementInterval);
      this.engagementInterval = null;
    }

    if (this.focusCheckInterval) {
      clearInterval(this.focusCheckInterval);
      this.focusCheckInterval = null;
    }
  }

  getFocusMetrics(): FocusMonitorMetrics {
    return {
      focusScore: Math.round(this.focusScore),
      distractionCount: this.distractionCount,
      sessionDuration: this.getSessionTime(),
      lastActivity: this.lastActivity
    };
  }

  registerInteraction() {
    this.lastActivity = new Date();
    this.focusScore = Math.min(100, this.focusScore + 2);
  }

  resetFocus() {
    this.focusScore = 100;
    this.distractionCount = 0;
  }

  private getSessionTime(): number {
    return (Date.now() - this.sessionStart.getTime()) / 1000;
  }

  private handleActivity = () => {
    this.lastActivity = new Date();
    this.scrollIdleSeconds = 0;
    this.focusScore = Math.min(100, this.focusScore + 0.5);
  };

  private visibilityListener = () => {
    if (document.hidden) {
      this.handlePotentialDistraction("tab_switch");
    } else {
      this.handleActivity();
    }
  };

  private trackEngagement() {
    if (typeof window === "undefined") return;
    const currentScrollY = window.scrollY;
    if (currentScrollY === this.lastScrollY) {
      this.scrollIdleSeconds += 1;
      if (this.scrollIdleSeconds > 30) {
        this.focusScore = Math.max(0, this.focusScore - 5);
      }
    } else {
      this.scrollIdleSeconds = 0;
      this.focusScore = Math.min(100, this.focusScore + 2);
    }
    this.lastScrollY = currentScrollY;
  }

  private handlePotentialDistraction(type: string) {
    this.distractionCount += 1;
    this.focusScore = Math.max(0, this.focusScore - 10);
    const log: DistractionLog = {
      type,
      timestamp: new Date(),
      focusScore: this.focusScore,
      sessionTime: this.getSessionTime()
    };
    this.config.onLog?.(log);
  }

  private checkFocusScore() {
    if (this.focusScore < this.config.distractionThreshold) {
      this.onDistractionCallback?.();
      this.resetFocus();
    }
  }
}

export type FocusSensitivity = "LOW" | "MEDIUM" | "HIGH";

export function useFocusMonitor(sensitivity: FocusSensitivity = "MEDIUM") {
  const { data: session } = useSession();
  const monitorRef = useRef<FocusMonitor | null>(null);
  const [isDistracted, setIsDistracted] = useState(false);
  const [focusMetrics, setFocusMetrics] = useState<FocusMonitorMetrics | null>(null);
  const [shouldShowGame, setShouldShowGame] = useState(false);

  const thresholds = useMemo(() => {
    if (sensitivity === "LOW") {
      return { idleThreshold: 60, distractionThreshold: 30 } as const;
    }
    if (sensitivity === "HIGH") {
      return { idleThreshold: 15, distractionThreshold: 70 } as const;
    }
    return { idleThreshold: 30, distractionThreshold: 50 } as const;
  }, [sensitivity]);

  const notifyDistraction = useCallback(
    async (type: string, metrics?: FocusMonitorMetrics) => {
      if (!session?.user?.id) return;
      try {
        await fetch("/api/focus/distraction-detected", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            learnerId: session?.user?.id,
            type,
            metrics
          })
        });
      } catch (error) {
        console.warn("Focus notification failed", error);
      }
    },
    [session?.user?.id]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const monitor = new FocusMonitor({
      idleThreshold: thresholds.idleThreshold,
      distractionThreshold: thresholds.distractionThreshold,
      learnerId: session?.user?.id,
      onLog: (entry) => {
        void notifyDistraction(entry.type, {
          ...monitor.getFocusMetrics(),
          focusScore: entry.focusScore
        });
      }
    });
    monitorRef.current = monitor;

    monitor.startMonitoring(() => {
      setIsDistracted(true);
      setShouldShowGame(true);
      void notifyDistraction("threshold_breach", monitor.getFocusMetrics());
    });

    setFocusMetrics({ ...monitor.getFocusMetrics() });

    const interval = window.setInterval(() => {
      setFocusMetrics({ ...monitor.getFocusMetrics() });
    }, 5000);

    return () => {
      monitor.stopMonitoring();
      clearInterval(interval);
    };
  }, [thresholds.distractionThreshold, thresholds.idleThreshold, notifyDistraction, session?.user?.id]);

  const resumeLearning = useCallback(() => {
    setIsDistracted(false);
    setShouldShowGame(false);
    monitorRef.current?.resetFocus();
  }, []);

  const registerInteraction = useCallback(() => {
    monitorRef.current?.registerInteraction();
  }, []);

  return {
    isDistracted,
    focusMetrics,
    shouldShowGame,
    resumeLearning,
    registerInteraction
  };
}
