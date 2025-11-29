/**
 * Seed script for AAC Symbol Library
 * 
 * This script populates the database with 200+ core vocabulary AAC symbols
 * organized by category, following established AAC vocabulary research.
 * 
 * Symbols are based on:
 * - Core vocabulary principles (high-frequency words)
 * - Fitzgerald Key color coding
 * - PCS (Picture Communication Symbols) conventions
 * 
 * Run with: pnpm tsx prisma/seeds/seed-aac-symbols.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Symbol category colors (Fitzgerald Key)
const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  CORE: { bg: "#FFFFFF", text: "#000000", border: "#3B82F6" },           // White - Core
  SOCIAL: { bg: "#FFD700", text: "#000000", border: "#EAB308" },         // Yellow - Social
  EMOTIONS: { bg: "#FFB6C1", text: "#000000", border: "#EC4899" },       // Pink - Emotions
  ACTIONS: { bg: "#90EE90", text: "#000000", border: "#22C55E" },        // Green - Actions/Verbs
  DESCRIPTORS: { bg: "#87CEEB", text: "#000000", border: "#0EA5E9" },    // Blue - Descriptors
  QUESTIONS: { bg: "#DDA0DD", text: "#000000", border: "#A855F7" },      // Purple - Questions
  PEOPLE: { bg: "#FFDAB9", text: "#000000", border: "#F97316" },         // Orange - People
  PLACES: { bg: "#D2691E", text: "#FFFFFF", border: "#92400E" },         // Brown - Places
  FOOD: { bg: "#FA8072", text: "#000000", border: "#EF4444" },           // Salmon - Food
  ACTIVITIES: { bg: "#98FB98", text: "#000000", border: "#4ADE80" },     // Light green - Activities
  DAILY_LIVING: { bg: "#B0E0E6", text: "#000000", border: "#06B6D4" },   // Light blue - Daily living
  ACADEMIC: { bg: "#E6E6FA", text: "#000000", border: "#8B5CF6" },       // Lavender - Academic
  FRINGE: { bg: "#F5F5F5", text: "#000000", border: "#6B7280" },         // Gray - Fringe vocabulary
};

// Base URL for symbol images (placeholder - would be replaced with actual CDN)
const SYMBOL_BASE_URL = "/symbols/pcs";

// Symbol definitions organized by category
const SYMBOLS: Array<{
  label: string;
  category: string;
  isCore: boolean;
  displayOrder: number;
}> = [
  // ===== CORE VOCABULARY (40 most essential words) =====
  // These are high-frequency words that make up 80% of daily communication
  
  // Core - Pronouns
  { label: "I", category: "CORE", isCore: true, displayOrder: 1 },
  { label: "you", category: "CORE", isCore: true, displayOrder: 2 },
  { label: "he", category: "CORE", isCore: true, displayOrder: 3 },
  { label: "she", category: "CORE", isCore: true, displayOrder: 4 },
  { label: "it", category: "CORE", isCore: true, displayOrder: 5 },
  { label: "we", category: "CORE", isCore: true, displayOrder: 6 },
  { label: "they", category: "CORE", isCore: true, displayOrder: 7 },
  { label: "my", category: "CORE", isCore: true, displayOrder: 8 },
  { label: "your", category: "CORE", isCore: true, displayOrder: 9 },
  
  // Core - Verbs
  { label: "want", category: "CORE", isCore: true, displayOrder: 10 },
  { label: "need", category: "CORE", isCore: true, displayOrder: 11 },
  { label: "like", category: "CORE", isCore: true, displayOrder: 12 },
  { label: "have", category: "CORE", isCore: true, displayOrder: 13 },
  { label: "go", category: "CORE", isCore: true, displayOrder: 14 },
  { label: "get", category: "CORE", isCore: true, displayOrder: 15 },
  { label: "make", category: "CORE", isCore: true, displayOrder: 16 },
  { label: "help", category: "CORE", isCore: true, displayOrder: 17 },
  { label: "put", category: "CORE", isCore: true, displayOrder: 18 },
  { label: "see", category: "CORE", isCore: true, displayOrder: 19 },
  { label: "do", category: "CORE", isCore: true, displayOrder: 20 },
  { label: "is", category: "CORE", isCore: true, displayOrder: 21 },
  { label: "can", category: "CORE", isCore: true, displayOrder: 22 },
  
  // Core - Adjectives/Descriptors
  { label: "more", category: "CORE", isCore: true, displayOrder: 23 },
  { label: "all done", category: "CORE", isCore: true, displayOrder: 24 },
  { label: "different", category: "CORE", isCore: true, displayOrder: 25 },
  { label: "same", category: "CORE", isCore: true, displayOrder: 26 },
  
  // Core - Location/Direction
  { label: "here", category: "CORE", isCore: true, displayOrder: 27 },
  { label: "there", category: "CORE", isCore: true, displayOrder: 28 },
  { label: "in", category: "CORE", isCore: true, displayOrder: 29 },
  { label: "on", category: "CORE", isCore: true, displayOrder: 30 },
  { label: "out", category: "CORE", isCore: true, displayOrder: 31 },
  { label: "up", category: "CORE", isCore: true, displayOrder: 32 },
  { label: "down", category: "CORE", isCore: true, displayOrder: 33 },
  
  // Core - Negation/Affirmation
  { label: "yes", category: "CORE", isCore: true, displayOrder: 34 },
  { label: "no", category: "CORE", isCore: true, displayOrder: 35 },
  { label: "not", category: "CORE", isCore: true, displayOrder: 36 },
  { label: "don't", category: "CORE", isCore: true, displayOrder: 37 },
  
  // Core - Other Essential
  { label: "that", category: "CORE", isCore: true, displayOrder: 38 },
  { label: "this", category: "CORE", isCore: true, displayOrder: 39 },
  { label: "some", category: "CORE", isCore: true, displayOrder: 40 },
  
  // ===== SOCIAL VOCABULARY (25 words) =====
  { label: "hello", category: "SOCIAL", isCore: false, displayOrder: 1 },
  { label: "goodbye", category: "SOCIAL", isCore: false, displayOrder: 2 },
  { label: "please", category: "SOCIAL", isCore: false, displayOrder: 3 },
  { label: "thank you", category: "SOCIAL", isCore: false, displayOrder: 4 },
  { label: "sorry", category: "SOCIAL", isCore: false, displayOrder: 5 },
  { label: "excuse me", category: "SOCIAL", isCore: false, displayOrder: 6 },
  { label: "hi", category: "SOCIAL", isCore: false, displayOrder: 7 },
  { label: "bye", category: "SOCIAL", isCore: false, displayOrder: 8 },
  { label: "good morning", category: "SOCIAL", isCore: false, displayOrder: 9 },
  { label: "good night", category: "SOCIAL", isCore: false, displayOrder: 10 },
  { label: "how are you", category: "SOCIAL", isCore: false, displayOrder: 11 },
  { label: "I'm fine", category: "SOCIAL", isCore: false, displayOrder: 12 },
  { label: "nice to meet you", category: "SOCIAL", isCore: false, displayOrder: 13 },
  { label: "you're welcome", category: "SOCIAL", isCore: false, displayOrder: 14 },
  { label: "wait", category: "SOCIAL", isCore: false, displayOrder: 15 },
  { label: "stop", category: "SOCIAL", isCore: false, displayOrder: 16 },
  { label: "share", category: "SOCIAL", isCore: false, displayOrder: 17 },
  { label: "take turns", category: "SOCIAL", isCore: false, displayOrder: 18 },
  { label: "help me", category: "SOCIAL", isCore: false, displayOrder: 19 },
  { label: "let's play", category: "SOCIAL", isCore: false, displayOrder: 20 },
  { label: "my turn", category: "SOCIAL", isCore: false, displayOrder: 21 },
  { label: "your turn", category: "SOCIAL", isCore: false, displayOrder: 22 },
  { label: "great job", category: "SOCIAL", isCore: false, displayOrder: 23 },
  { label: "I don't know", category: "SOCIAL", isCore: false, displayOrder: 24 },
  { label: "I need help", category: "SOCIAL", isCore: false, displayOrder: 25 },
  
  // ===== EMOTIONS (25 words) =====
  { label: "happy", category: "EMOTIONS", isCore: false, displayOrder: 1 },
  { label: "sad", category: "EMOTIONS", isCore: false, displayOrder: 2 },
  { label: "angry", category: "EMOTIONS", isCore: false, displayOrder: 3 },
  { label: "scared", category: "EMOTIONS", isCore: false, displayOrder: 4 },
  { label: "tired", category: "EMOTIONS", isCore: false, displayOrder: 5 },
  { label: "excited", category: "EMOTIONS", isCore: false, displayOrder: 6 },
  { label: "worried", category: "EMOTIONS", isCore: false, displayOrder: 7 },
  { label: "frustrated", category: "EMOTIONS", isCore: false, displayOrder: 8 },
  { label: "calm", category: "EMOTIONS", isCore: false, displayOrder: 9 },
  { label: "silly", category: "EMOTIONS", isCore: false, displayOrder: 10 },
  { label: "bored", category: "EMOTIONS", isCore: false, displayOrder: 11 },
  { label: "hungry", category: "EMOTIONS", isCore: false, displayOrder: 12 },
  { label: "thirsty", category: "EMOTIONS", isCore: false, displayOrder: 13 },
  { label: "sick", category: "EMOTIONS", isCore: false, displayOrder: 14 },
  { label: "hurt", category: "EMOTIONS", isCore: false, displayOrder: 15 },
  { label: "surprised", category: "EMOTIONS", isCore: false, displayOrder: 16 },
  { label: "proud", category: "EMOTIONS", isCore: false, displayOrder: 17 },
  { label: "embarrassed", category: "EMOTIONS", isCore: false, displayOrder: 18 },
  { label: "confused", category: "EMOTIONS", isCore: false, displayOrder: 19 },
  { label: "lonely", category: "EMOTIONS", isCore: false, displayOrder: 20 },
  { label: "love", category: "EMOTIONS", isCore: false, displayOrder: 21 },
  { label: "I feel", category: "EMOTIONS", isCore: false, displayOrder: 22 },
  { label: "I am", category: "EMOTIONS", isCore: false, displayOrder: 23 },
  { label: "okay", category: "EMOTIONS", isCore: false, displayOrder: 24 },
  { label: "not okay", category: "EMOTIONS", isCore: false, displayOrder: 25 },
  
  // ===== ACTIONS/VERBS (30 words) =====
  { label: "eat", category: "ACTIONS", isCore: false, displayOrder: 1 },
  { label: "drink", category: "ACTIONS", isCore: false, displayOrder: 2 },
  { label: "play", category: "ACTIONS", isCore: false, displayOrder: 3 },
  { label: "read", category: "ACTIONS", isCore: false, displayOrder: 4 },
  { label: "write", category: "ACTIONS", isCore: false, displayOrder: 5 },
  { label: "draw", category: "ACTIONS", isCore: false, displayOrder: 6 },
  { label: "listen", category: "ACTIONS", isCore: false, displayOrder: 7 },
  { label: "look", category: "ACTIONS", isCore: false, displayOrder: 8 },
  { label: "sit", category: "ACTIONS", isCore: false, displayOrder: 9 },
  { label: "stand", category: "ACTIONS", isCore: false, displayOrder: 10 },
  { label: "walk", category: "ACTIONS", isCore: false, displayOrder: 11 },
  { label: "run", category: "ACTIONS", isCore: false, displayOrder: 12 },
  { label: "jump", category: "ACTIONS", isCore: false, displayOrder: 13 },
  { label: "push", category: "ACTIONS", isCore: false, displayOrder: 14 },
  { label: "pull", category: "ACTIONS", isCore: false, displayOrder: 15 },
  { label: "open", category: "ACTIONS", isCore: false, displayOrder: 16 },
  { label: "close", category: "ACTIONS", isCore: false, displayOrder: 17 },
  { label: "give", category: "ACTIONS", isCore: false, displayOrder: 18 },
  { label: "take", category: "ACTIONS", isCore: false, displayOrder: 19 },
  { label: "find", category: "ACTIONS", isCore: false, displayOrder: 20 },
  { label: "hide", category: "ACTIONS", isCore: false, displayOrder: 21 },
  { label: "sleep", category: "ACTIONS", isCore: false, displayOrder: 22 },
  { label: "wash", category: "ACTIONS", isCore: false, displayOrder: 23 },
  { label: "clean", category: "ACTIONS", isCore: false, displayOrder: 24 },
  { label: "build", category: "ACTIONS", isCore: false, displayOrder: 25 },
  { label: "break", category: "ACTIONS", isCore: false, displayOrder: 26 },
  { label: "fix", category: "ACTIONS", isCore: false, displayOrder: 27 },
  { label: "try", category: "ACTIONS", isCore: false, displayOrder: 28 },
  { label: "think", category: "ACTIONS", isCore: false, displayOrder: 29 },
  { label: "know", category: "ACTIONS", isCore: false, displayOrder: 30 },
  
  // ===== DESCRIPTORS (25 words) =====
  { label: "big", category: "DESCRIPTORS", isCore: false, displayOrder: 1 },
  { label: "small", category: "DESCRIPTORS", isCore: false, displayOrder: 2 },
  { label: "hot", category: "DESCRIPTORS", isCore: false, displayOrder: 3 },
  { label: "cold", category: "DESCRIPTORS", isCore: false, displayOrder: 4 },
  { label: "fast", category: "DESCRIPTORS", isCore: false, displayOrder: 5 },
  { label: "slow", category: "DESCRIPTORS", isCore: false, displayOrder: 6 },
  { label: "good", category: "DESCRIPTORS", isCore: false, displayOrder: 7 },
  { label: "bad", category: "DESCRIPTORS", isCore: false, displayOrder: 8 },
  { label: "new", category: "DESCRIPTORS", isCore: false, displayOrder: 9 },
  { label: "old", category: "DESCRIPTORS", isCore: false, displayOrder: 10 },
  { label: "soft", category: "DESCRIPTORS", isCore: false, displayOrder: 11 },
  { label: "hard", category: "DESCRIPTORS", isCore: false, displayOrder: 12 },
  { label: "loud", category: "DESCRIPTORS", isCore: false, displayOrder: 13 },
  { label: "quiet", category: "DESCRIPTORS", isCore: false, displayOrder: 14 },
  { label: "clean", category: "DESCRIPTORS", isCore: false, displayOrder: 15 },
  { label: "dirty", category: "DESCRIPTORS", isCore: false, displayOrder: 16 },
  { label: "wet", category: "DESCRIPTORS", isCore: false, displayOrder: 17 },
  { label: "dry", category: "DESCRIPTORS", isCore: false, displayOrder: 18 },
  { label: "full", category: "DESCRIPTORS", isCore: false, displayOrder: 19 },
  { label: "empty", category: "DESCRIPTORS", isCore: false, displayOrder: 20 },
  { label: "first", category: "DESCRIPTORS", isCore: false, displayOrder: 21 },
  { label: "last", category: "DESCRIPTORS", isCore: false, displayOrder: 22 },
  { label: "all", category: "DESCRIPTORS", isCore: false, displayOrder: 23 },
  { label: "none", category: "DESCRIPTORS", isCore: false, displayOrder: 24 },
  { label: "favorite", category: "DESCRIPTORS", isCore: false, displayOrder: 25 },
  
  // ===== QUESTIONS (15 words) =====
  { label: "what", category: "QUESTIONS", isCore: false, displayOrder: 1 },
  { label: "where", category: "QUESTIONS", isCore: false, displayOrder: 2 },
  { label: "when", category: "QUESTIONS", isCore: false, displayOrder: 3 },
  { label: "who", category: "QUESTIONS", isCore: false, displayOrder: 4 },
  { label: "why", category: "QUESTIONS", isCore: false, displayOrder: 5 },
  { label: "how", category: "QUESTIONS", isCore: false, displayOrder: 6 },
  { label: "which", category: "QUESTIONS", isCore: false, displayOrder: 7 },
  { label: "what is this", category: "QUESTIONS", isCore: false, displayOrder: 8 },
  { label: "where is", category: "QUESTIONS", isCore: false, displayOrder: 9 },
  { label: "can I", category: "QUESTIONS", isCore: false, displayOrder: 10 },
  { label: "what's wrong", category: "QUESTIONS", isCore: false, displayOrder: 11 },
  { label: "how many", category: "QUESTIONS", isCore: false, displayOrder: 12 },
  { label: "what time", category: "QUESTIONS", isCore: false, displayOrder: 13 },
  { label: "do you want", category: "QUESTIONS", isCore: false, displayOrder: 14 },
  { label: "are you okay", category: "QUESTIONS", isCore: false, displayOrder: 15 },
  
  // ===== PEOPLE (15 words) =====
  { label: "mom", category: "PEOPLE", isCore: false, displayOrder: 1 },
  { label: "dad", category: "PEOPLE", isCore: false, displayOrder: 2 },
  { label: "grandma", category: "PEOPLE", isCore: false, displayOrder: 3 },
  { label: "grandpa", category: "PEOPLE", isCore: false, displayOrder: 4 },
  { label: "brother", category: "PEOPLE", isCore: false, displayOrder: 5 },
  { label: "sister", category: "PEOPLE", isCore: false, displayOrder: 6 },
  { label: "friend", category: "PEOPLE", isCore: false, displayOrder: 7 },
  { label: "teacher", category: "PEOPLE", isCore: false, displayOrder: 8 },
  { label: "doctor", category: "PEOPLE", isCore: false, displayOrder: 9 },
  { label: "baby", category: "PEOPLE", isCore: false, displayOrder: 10 },
  { label: "boy", category: "PEOPLE", isCore: false, displayOrder: 11 },
  { label: "girl", category: "PEOPLE", isCore: false, displayOrder: 12 },
  { label: "man", category: "PEOPLE", isCore: false, displayOrder: 13 },
  { label: "woman", category: "PEOPLE", isCore: false, displayOrder: 14 },
  { label: "helper", category: "PEOPLE", isCore: false, displayOrder: 15 },
  
  // ===== PLACES (15 words) =====
  { label: "home", category: "PLACES", isCore: false, displayOrder: 1 },
  { label: "school", category: "PLACES", isCore: false, displayOrder: 2 },
  { label: "bathroom", category: "PLACES", isCore: false, displayOrder: 3 },
  { label: "bedroom", category: "PLACES", isCore: false, displayOrder: 4 },
  { label: "kitchen", category: "PLACES", isCore: false, displayOrder: 5 },
  { label: "outside", category: "PLACES", isCore: false, displayOrder: 6 },
  { label: "inside", category: "PLACES", isCore: false, displayOrder: 7 },
  { label: "playground", category: "PLACES", isCore: false, displayOrder: 8 },
  { label: "store", category: "PLACES", isCore: false, displayOrder: 9 },
  { label: "park", category: "PLACES", isCore: false, displayOrder: 10 },
  { label: "car", category: "PLACES", isCore: false, displayOrder: 11 },
  { label: "bus", category: "PLACES", isCore: false, displayOrder: 12 },
  { label: "pool", category: "PLACES", isCore: false, displayOrder: 13 },
  { label: "library", category: "PLACES", isCore: false, displayOrder: 14 },
  { label: "hospital", category: "PLACES", isCore: false, displayOrder: 15 },
  
  // ===== FOOD (20 words) =====
  { label: "water", category: "FOOD", isCore: false, displayOrder: 1 },
  { label: "juice", category: "FOOD", isCore: false, displayOrder: 2 },
  { label: "milk", category: "FOOD", isCore: false, displayOrder: 3 },
  { label: "apple", category: "FOOD", isCore: false, displayOrder: 4 },
  { label: "banana", category: "FOOD", isCore: false, displayOrder: 5 },
  { label: "cookie", category: "FOOD", isCore: false, displayOrder: 6 },
  { label: "cracker", category: "FOOD", isCore: false, displayOrder: 7 },
  { label: "cheese", category: "FOOD", isCore: false, displayOrder: 8 },
  { label: "bread", category: "FOOD", isCore: false, displayOrder: 9 },
  { label: "pizza", category: "FOOD", isCore: false, displayOrder: 10 },
  { label: "chicken", category: "FOOD", isCore: false, displayOrder: 11 },
  { label: "ice cream", category: "FOOD", isCore: false, displayOrder: 12 },
  { label: "cereal", category: "FOOD", isCore: false, displayOrder: 13 },
  { label: "sandwich", category: "FOOD", isCore: false, displayOrder: 14 },
  { label: "snack", category: "FOOD", isCore: false, displayOrder: 15 },
  { label: "breakfast", category: "FOOD", isCore: false, displayOrder: 16 },
  { label: "lunch", category: "FOOD", isCore: false, displayOrder: 17 },
  { label: "dinner", category: "FOOD", isCore: false, displayOrder: 18 },
  { label: "fruit", category: "FOOD", isCore: false, displayOrder: 19 },
  { label: "vegetable", category: "FOOD", isCore: false, displayOrder: 20 },
  
  // ===== ACTIVITIES (15 words) =====
  { label: "swing", category: "ACTIVITIES", isCore: false, displayOrder: 1 },
  { label: "slide", category: "ACTIVITIES", isCore: false, displayOrder: 2 },
  { label: "dance", category: "ACTIVITIES", isCore: false, displayOrder: 3 },
  { label: "sing", category: "ACTIVITIES", isCore: false, displayOrder: 4 },
  { label: "paint", category: "ACTIVITIES", isCore: false, displayOrder: 5 },
  { label: "color", category: "ACTIVITIES", isCore: false, displayOrder: 6 },
  { label: "puzzle", category: "ACTIVITIES", isCore: false, displayOrder: 7 },
  { label: "game", category: "ACTIVITIES", isCore: false, displayOrder: 8 },
  { label: "movie", category: "ACTIVITIES", isCore: false, displayOrder: 9 },
  { label: "music", category: "ACTIVITIES", isCore: false, displayOrder: 10 },
  { label: "book", category: "ACTIVITIES", isCore: false, displayOrder: 11 },
  { label: "toy", category: "ACTIVITIES", isCore: false, displayOrder: 12 },
  { label: "ball", category: "ACTIVITIES", isCore: false, displayOrder: 13 },
  { label: "bike", category: "ACTIVITIES", isCore: false, displayOrder: 14 },
  { label: "computer", category: "ACTIVITIES", isCore: false, displayOrder: 15 },
  
  // ===== DAILY LIVING (15 words) =====
  { label: "brush teeth", category: "DAILY_LIVING", isCore: false, displayOrder: 1 },
  { label: "take bath", category: "DAILY_LIVING", isCore: false, displayOrder: 2 },
  { label: "get dressed", category: "DAILY_LIVING", isCore: false, displayOrder: 3 },
  { label: "shoes", category: "DAILY_LIVING", isCore: false, displayOrder: 4 },
  { label: "coat", category: "DAILY_LIVING", isCore: false, displayOrder: 5 },
  { label: "bed", category: "DAILY_LIVING", isCore: false, displayOrder: 6 },
  { label: "potty", category: "DAILY_LIVING", isCore: false, displayOrder: 7 },
  { label: "diaper", category: "DAILY_LIVING", isCore: false, displayOrder: 8 },
  { label: "medicine", category: "DAILY_LIVING", isCore: false, displayOrder: 9 },
  { label: "nap", category: "DAILY_LIVING", isCore: false, displayOrder: 10 },
  { label: "wake up", category: "DAILY_LIVING", isCore: false, displayOrder: 11 },
  { label: "time to go", category: "DAILY_LIVING", isCore: false, displayOrder: 12 },
  { label: "finished", category: "DAILY_LIVING", isCore: false, displayOrder: 13 },
  { label: "ready", category: "DAILY_LIVING", isCore: false, displayOrder: 14 },
  { label: "later", category: "DAILY_LIVING", isCore: false, displayOrder: 15 },
  
  // ===== ACADEMIC (15 words) =====
  { label: "count", category: "ACADEMIC", isCore: false, displayOrder: 1 },
  { label: "number", category: "ACADEMIC", isCore: false, displayOrder: 2 },
  { label: "letter", category: "ACADEMIC", isCore: false, displayOrder: 3 },
  { label: "word", category: "ACADEMIC", isCore: false, displayOrder: 4 },
  { label: "story", category: "ACADEMIC", isCore: false, displayOrder: 5 },
  { label: "question", category: "ACADEMIC", isCore: false, displayOrder: 6 },
  { label: "answer", category: "ACADEMIC", isCore: false, displayOrder: 7 },
  { label: "right", category: "ACADEMIC", isCore: false, displayOrder: 8 },
  { label: "wrong", category: "ACADEMIC", isCore: false, displayOrder: 9 },
  { label: "spell", category: "ACADEMIC", isCore: false, displayOrder: 10 },
  { label: "add", category: "ACADEMIC", isCore: false, displayOrder: 11 },
  { label: "subtract", category: "ACADEMIC", isCore: false, displayOrder: 12 },
  { label: "circle", category: "ACADEMIC", isCore: false, displayOrder: 13 },
  { label: "square", category: "ACADEMIC", isCore: false, displayOrder: 14 },
  { label: "color name", category: "ACADEMIC", isCore: false, displayOrder: 15 },
];

async function main() {
  console.log("🔤 Starting AAC Symbol Library seed...\n");

  // Clear existing symbols
  console.log("Clearing existing symbols...");
  await (prisma as any).aACSymbol.deleteMany();

  // Create symbols
  console.log("Creating symbols...\n");
  
  let created = 0;
  const errors: string[] = [];

  for (const symbolData of SYMBOLS) {
    const colors = CATEGORY_COLORS[symbolData.category] || CATEGORY_COLORS.FRINGE;
    const imageFileName = symbolData.label.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    
    try {
      await (prisma as any).aACSymbol.create({
        data: {
          label: symbolData.label,
          category: symbolData.category as any,
          imageUrl: `${SYMBOL_BASE_URL}/${symbolData.category.toLowerCase()}/${imageFileName}.png`,
          symbolSet: "PCS",
          isCore: symbolData.isCore,
          displayOrder: symbolData.displayOrder,
          backgroundColor: colors.bg,
          textColor: colors.text,
          borderColor: colors.border,
          metadata: {
            fitzgeraldKey: symbolData.category,
            frequency: symbolData.isCore ? "high" : "medium",
          },
        },
      });
      created++;
    } catch (error) {
      errors.push(`Failed to create symbol "${symbolData.label}": ${error}`);
    }
  }

  console.log(`\n✅ Created ${created} symbols`);
  
  if (errors.length > 0) {
    console.log(`\n⚠️ ${errors.length} errors:`);
    errors.forEach((e) => console.log(`  - ${e}`));
  }

  // Summary by category
  console.log("\n📊 Symbols by category:");
  const categories = [...new Set(SYMBOLS.map((s) => s.category))];
  for (const category of categories) {
    const count = SYMBOLS.filter((s) => s.category === category).length;
    const coreCount = SYMBOLS.filter((s) => s.category === category && s.isCore).length;
    console.log(`  ${category}: ${count} symbols (${coreCount} core)`);
  }

  console.log(`\nTotal: ${SYMBOLS.length} symbols (${SYMBOLS.filter(s => s.isCore).length} core)`);
  console.log("\n🎉 AAC Symbol Library seed complete!");
}

main()
  .catch((e) => {
    console.error("Error seeding AAC symbols:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
