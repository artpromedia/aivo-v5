"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGradeBand = getGradeBand;
exports.computeDifficultyLevel = computeDifficultyLevel;
exports.getDifficultyRecommendations = getDifficultyRecommendations;
function getGradeBand(grade) {
    if (grade <= 5)
        return "k_5";
    if (grade <= 8)
        return "6_8";
    return "9_12";
}
function computeDifficultyLevel(level) {
    const diff = level.enrolledGrade - level.assessedGradeLevel;
    if (diff >= 2)
        return "remedial";
    if (diff <= -1)
        return "advanced";
    return "on_level";
}
function getDifficultyRecommendations(profile) {
    return profile.subjectLevels.map((level) => {
        const mode = computeDifficultyLevel(level);
        if (mode === "remedial") {
            return {
                subject: level.subject,
                recommendedDifficulty: "easier",
                rationale: "Learner is significantly below enrolled grade in this subject; scaffold 7th grade content at a 5th grade difficulty and gradually ramp up."
            };
        }
        if (mode === "advanced") {
            return {
                subject: level.subject,
                recommendedDifficulty: "harder",
                rationale: "Learner is ahead of enrolled grade; introduce more challenging extensions with explicit consent from guardian/teacher."
            };
        }
        return {
            subject: level.subject,
            recommendedDifficulty: "maintain",
            rationale: "Learner is close to enrolled grade; keep current difficulty and monitor mastery."
        };
    });
}
