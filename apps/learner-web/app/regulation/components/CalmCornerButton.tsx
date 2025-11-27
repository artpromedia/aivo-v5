"use client";

/**
 * CalmCornerButton Component
 * Floating quick-access button for the Self-Regulation Hub
 * Provides immediate access to calming activities from anywhere in the app
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface CalmCornerButtonProps {
  /** Position of the button */
  position?: "bottom-right" | "bottom-left";
  /** Whether to show a quick menu with activity shortcuts */
  showQuickMenu?: boolean;
}

const QUICK_ACTIVITIES = [
  { id: "breathing", emoji: "🌬️", label: "Breathe", color: "bg-primary-500" },
  { id: "movement", emoji: "🏃", label: "Move", color: "bg-mint-dark" },
  { id: "grounding", emoji: "🌿", label: "Ground", color: "bg-sky-dark" },
];

export function CalmCornerButton({ 
  position = "bottom-right", 
  showQuickMenu = true 
}: CalmCornerButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPulsing, setIsPulsing] = useState(true);

  // Respect reduce-motion preference
  const prefersReducedMotion = typeof window !== "undefined"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

  const positionClasses = position === "bottom-right" 
    ? "right-4 bottom-4 md:right-6 md:bottom-6" 
    : "left-4 bottom-4 md:left-6 md:bottom-6";

  const handleMainClick = () => {
    if (showQuickMenu) {
      setIsExpanded(!isExpanded);
      setIsPulsing(false);
    }
  };

  return (
    <div 
      className={`fixed ${positionClasses} z-50`}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Quick menu */}
      <AnimatePresence>
        {isExpanded && showQuickMenu && (
          <motion.div
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-16 right-0 mb-2"
          >
            <div className="bg-white rounded-2xl shadow-card p-3 min-w-[180px]">
              <p className="text-xs text-slate-500 mb-2 px-2">Quick activities</p>
              <div className="space-y-1">
                {QUICK_ACTIVITIES.map((activity) => (
                  <Link
                    key={activity.id}
                    href={`/regulation?start=${activity.id}`}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors"
                    onClick={() => setIsExpanded(false)}
                  >
                    <span className={`w-8 h-8 ${activity.color} rounded-lg flex items-center justify-center text-white text-sm`}>
                      {activity.emoji}
                    </span>
                    <span className="text-sm font-medium text-slate-700">{activity.label}</span>
                  </Link>
                ))}
              </div>
              <div className="border-t border-slate-100 mt-2 pt-2">
                <Link
                  href="/regulation"
                  className="block text-center text-sm text-primary-600 hover:text-primary-700 font-medium py-1"
                  onClick={() => setIsExpanded(false)}
                >
                  Open Full Hub →
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main floating button */}
      <motion.div
        className="relative"
        animate={!prefersReducedMotion && isPulsing ? {
          scale: [1, 1.05, 1],
        } : {}}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatType: "loop",
        }}
      >
        {/* Glow effect */}
        {isPulsing && !prefersReducedMotion && (
          <div className="absolute inset-0 bg-primary-400 rounded-full blur-lg opacity-30 animate-pulse" />
        )}
        
        {showQuickMenu ? (
          <button
            onClick={handleMainClick}
            className={`
              relative w-14 h-14 md:w-16 md:h-16 rounded-full
              bg-gradient-to-br from-primary-500 to-primary-600
              text-white shadow-lg hover:shadow-xl
              flex items-center justify-center
              transition-all duration-200
              ${isExpanded ? "ring-4 ring-primary-200" : "hover:scale-105"}
            `}
            aria-label="Open calm corner menu"
            aria-expanded={isExpanded}
          >
            <span className="text-2xl md:text-3xl">
              {isExpanded ? "✕" : "🌈"}
            </span>
          </button>
        ) : (
          <Link
            href="/regulation"
            className={`
              relative w-14 h-14 md:w-16 md:h-16 rounded-full
              bg-gradient-to-br from-primary-500 to-primary-600
              text-white shadow-lg hover:shadow-xl
              flex items-center justify-center
              transition-all duration-200
              hover:scale-105
            `}
            aria-label="Go to calm corner"
          >
            <span className="text-2xl md:text-3xl">🌈</span>
          </Link>
        )}
      </motion.div>

      {/* Tooltip for first-time users */}
      {isPulsing && !isExpanded && (
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 2 }}
          className={`
            absolute bottom-full mb-2 
            ${position === "bottom-right" ? "right-0" : "left-0"}
            bg-white rounded-xl shadow-soft p-3 
            whitespace-nowrap text-sm
          `}
        >
          <p className="text-slate-700 font-medium">Need a break? 🌿</p>
          <p className="text-slate-500 text-xs">Tap for calming activities</p>
          {/* Arrow */}
          <div className={`
            absolute top-full w-3 h-3 bg-white transform rotate-45 -mt-1.5
            ${position === "bottom-right" ? "right-6" : "left-6"}
          `} />
        </motion.div>
      )}
    </div>
  );
}

export default CalmCornerButton;
