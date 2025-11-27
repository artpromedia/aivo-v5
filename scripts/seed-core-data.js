"use strict";
// @ts-nocheck
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const PASSWORD_PLACEHOLDER = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";
const prisma = new client_1.PrismaClient();
async function seedCoreData() {
    const adminUser = await prisma.user.create({
        data: {
            username: "admin_demo",
            email: "admin@aivo.local",
            password: PASSWORD_PLACEHOLDER,
            role: client_1.Role.ADMIN
        }
    });
    const guardianUser = await prisma.user.create({
        data: {
            username: "guardian_lena",
            email: "lena.guardian@aivo.local",
            password: PASSWORD_PLACEHOLDER,
            role: client_1.Role.PARENT
        }
    });
    const teacherUser = await prisma.user.create({
        data: {
            username: "teacher_rojas",
            email: "sofia.rojas@aivo.local",
            password: PASSWORD_PLACEHOLDER,
            role: client_1.Role.TEACHER
        }
    });
    const learnerUser = await prisma.user.create({
        data: {
            username: "learner_sam",
            email: "sam.garcia@aivo.local",
            password: PASSWORD_PLACEHOLDER,
            role: client_1.Role.LEARNER
        }
    });
    await prisma.profile.createMany({
        data: [
            {
                userId: guardianUser.id,
                firstName: "Lena",
                lastName: "Garcia",
                phone: "555-0110",
                address: "1200 Horizon Way, San Diego, CA",
                preferences: {
                    notifyChannel: "email",
                    language: "en-US"
                }
            },
            {
                userId: teacherUser.id,
                firstName: "Sofia",
                lastName: "Rojas",
                phone: "555-0122",
                address: "850 Mission Blvd, San Diego, CA",
                preferences: {
                    notifyChannel: "push",
                    timezone: "America/Los_Angeles"
                }
            },
            {
                userId: learnerUser.id,
                firstName: "Sam",
                lastName: "Garcia",
                preferences: {
                    preferredVoice: "calm",
                    colorContrast: "high"
                }
            }
        ]
    });
    const learner = await prisma.learner.create({
        data: {
            userId: learnerUser.id,
            guardianId: guardianUser.id,
            firstName: "Sam",
            lastName: "Garcia",
            dateOfBirth: new Date("2015-03-15T00:00:00.000Z"),
            gradeLevel: 4,
            actualLevel: 3.2
        }
    });
    const seededAccommodations = [
        client_1.AccommodationType.FREQUENT_BREAKS,
        client_1.AccommodationType.CHUNKED_CONTENT,
        client_1.AccommodationType.VISUAL_SCHEDULES,
        client_1.AccommodationType.CALM_DOWN_STRATEGIES
    ];
    await seedLearnerAccommodationPlan(prisma, learner.id, seededAccommodations);
    await prisma.diagnosis.create({
        data: {
            learnerId: learner.id,
            type: "ADHD-Inattentive",
            severity: "moderate",
            notes: "Responds well to short movement breaks",
            diagnosedAt: new Date("2023-10-01T00:00:00.000Z")
        }
    });
    await prisma.iEPGoal.create({
        data: {
            learnerId: learner.id,
            goal: "Improve reading comprehension to grade level",
            category: "Literacy",
            targetDate: new Date("2025-05-30T00:00:00.000Z"),
            status: client_1.GoalStatus.IN_PROGRESS,
            progress: 0.42,
            notes: "Focus on inference and summarizing short passages"
        }
    });
    const assessment = await prisma.assessment.create({
        data: {
            learnerId: learner.id,
            type: client_1.AssessmentType.BASELINE,
            status: client_1.AssessmentStatus.COMPLETED,
            startedAt: new Date("2025-01-10T16:00:00.000Z"),
            completedAt: new Date("2025-01-10T16:45:00.000Z"),
            overallLevel: 3.1,
            domains: {
                create: [
                    {
                        domain: client_1.DomainType.READING,
                        questions: {
                            items: 24,
                            questionTypes: ["vocab", "inference", "structure"]
                        },
                        responses: {
                            correct: 18,
                            incorrect: 6
                        },
                        score: 0.75,
                        level: 3.0
                    },
                    {
                        domain: client_1.DomainType.MATH,
                        questions: {
                            items: 24,
                            strands: ["number sense", "fractions"]
                        },
                        responses: {
                            correct: 16,
                            incorrect: 8
                        },
                        score: 0.67,
                        level: 3.2
                    }
                ]
            },
            results: {
                focus: 0.68,
                persistence: 0.8
            }
        }
    });
    const learningSession = await prisma.learningSession.create({
        data: {
            learnerId: learner.id,
            subject: "Reading",
            topic: "Character motivations",
            gradeLevel: 4,
            presentationLevel: 3.2,
            startTime: new Date("2025-01-21T17:00:00.000Z"),
            endTime: new Date("2025-01-21T17:35:00.000Z"),
            duration: 35,
            interactions: {
                hintsRequested: 2,
                retries: 1
            },
            focusScore: 0.74,
            completion: 0.9
        }
    });
    await seedAccommodationEffectiveness(prisma, learner.id, learningSession.id);
    await prisma.focusData.create({
        data: {
            learnerId: learner.id,
            sessionId: learningSession.id,
            focusScore: 0.71,
            distractions: 3,
            timestamp: new Date("2025-01-21T17:12:00.000Z"),
            metrics: {
                gazeStability: 0.78,
                movementBreaks: 1
            }
        }
    });
    const focusBackfill = [
        { offsetMinutes: -120, score: 0.64, distractions: 5, gaze: 0.7, breaks: 2 },
        { offsetMinutes: -95, score: 0.69, distractions: 4, gaze: 0.74, breaks: 1 },
        { offsetMinutes: -60, score: 0.73, distractions: 2, gaze: 0.8, breaks: 1 },
        { offsetMinutes: -30, score: 0.77, distractions: 1, gaze: 0.83, breaks: 0 },
        { offsetMinutes: -5, score: 0.82, distractions: 1, gaze: 0.88, breaks: 0 }
    ];
    await prisma.focusData.createMany({
        data: focusBackfill.map((entry) => ({
            learnerId: learner.id,
            sessionId: learningSession.id,
            focusScore: entry.score,
            distractions: entry.distractions,
            timestamp: new Date(new Date("2025-01-21T17:12:00.000Z").getTime() + entry.offsetMinutes * 60 * 1000),
            metrics: {
                gazeStability: entry.gaze,
                movementBreaks: entry.breaks
            }
        }))
    });
    await prisma.gameSession.create({
        data: {
            learnerId: learner.id,
            gameType: client_1.GameType.PUZZLE,
            subject: "Math",
            difficulty: 3,
            duration: 8,
            score: 1200,
            completed: true,
            triggeredBy: "focus_recovery"
        }
    });
    await prisma.progress.createMany({
        data: [
            {
                learnerId: learner.id,
                domain: client_1.DomainType.READING,
                date: new Date("2025-01-14T00:00:00.000Z"),
                level: 3.0,
                score: 0.72,
                timeSpent: 42
            },
            {
                learnerId: learner.id,
                domain: client_1.DomainType.READING,
                date: new Date("2025-01-21T00:00:00.000Z"),
                level: 3.3,
                score: 0.81,
                timeSpent: 55
            }
        ]
    });
    await prisma.personalizedModel.create({
        data: {
            learnerId: learner.id,
            modelId: "learner-sam-v1",
            systemPrompt: "You are Sam's adaptive learning guide.",
            vectorStoreId: "vs_sam_primary",
            configuration: {
                targetFocusScore: 0.75,
                reinforcement: "growth_mindset",
                hintBudget: 3
            },
            status: client_1.PersonalizedModelStatus.ACTIVE,
            version: 2,
            performanceMetrics: {
                mae: 0.18,
                precision: 0.82
            },
            lastTrainedAt: new Date("2025-01-18T00:00:00.000Z")
        }
    });
    const homeroom = await prisma.class.create({
        data: {
            name: "Explorers Homeroom",
            description: "Cohort focused on executive function supports",
            gradeLevel: 4,
            teacherId: teacherUser.id,
            startDate: new Date("2025-01-06T00:00:00.000Z"),
            endDate: new Date("2025-06-10T00:00:00.000Z"),
            enrollments: {
                create: [
                    {
                        learnerId: learner.id,
                        status: client_1.EnrollmentStatus.ACTIVE
                    }
                ]
            },
            assignments: {
                create: [
                    {
                        title: "Perspective-taking journal",
                        description: "Write about the main character's choices",
                        type: "reflection",
                        content: {
                            rubric: {
                                details: ["Evidence from text", "Personal insight"]
                            }
                        },
                        dueDate: new Date("2025-01-28T00:00:00.000Z")
                    }
                ]
            }
        }
    });
    await prisma.approvalRequest.create({
        data: {
            type: client_1.ApprovalType.DIFFICULTY_CHANGE,
            learnerId: learner.id,
            requesterId: teacherUser.id,
            approverId: adminUser.id,
            status: client_1.ApprovalStatus.PENDING,
            details: {
                fromLevel: 3.1,
                toLevel: 3.4,
                reason: "Sustained mastery in main idea tasks"
            },
            comments: "Awaiting confirmation from MTSS coordinator"
        }
    });
    await prisma.notification.create({
        data: {
            userId: guardianUser.id,
            learnerId: learner.id,
            type: "learning_update",
            title: "Sam completed their adaptive reading session",
            message: "Focus score improved by 12% this week.",
            data: {
                learnerId: learner.id,
                classId: homeroom.id
            }
        }
    });
    await prisma.session.create({
        data: {
            sessionToken: "dev-session-token",
            userId: guardianUser.id,
            expires: new Date(Date.now() + 1000 * 60 * 60 * 24)
        }
    });
    const literacyTopic = await prisma.curriculumTopic.create({
        data: {
            tenantId,
            subject: "reading",
            grade: 4,
            region: "us_ca",
            standard: "us_common_core",
            code: "CCSS.ELA-LITERACY.RL.4.3",
            title: "Analyze character traits",
            description: "Students describe characters in depth using evidence from the text"
        }
    });
    await prisma.contentItem.create({
        data: {
            tenantId,
            topicId: literacyTopic.id,
            subject: "reading",
            grade: 4,
            type: "practice_question",
            title: "Why did the character change?",
            body: "After reading the passage, explain how the main character changes from beginning to end.",
            questionFormat: "open_response",
            options: client_1.Prisma.JsonNull,
            correctAnswer: null,
            accessibilityNotes: "Offer sentence starters",
            status: "published",
            createdByUserId: teacherUser.id,
            aiGenerated: false
        }
    });
    const experiment = await prisma.experiment.create({
        data: {
            tenantId,
            key: "focus_prompt_variation",
            name: "Focus Prompt Variation",
            status: "running",
            description: "A/B test of focus reminder phrasing",
            variants: [
                { id: "a", key: "warm", label: "Warm", description: "Friendly language" },
                { id: "b", key: "crisp", label: "Crisp", description: "Direct language" }
            ],
            targeting: {
                gradeBands: ["k_5"],
                subjects: ["reading"]
            },
            createdByUserId: teacherUser.id
        }
    });
    await prisma.experimentAssignment.create({
        data: {
            experimentId: experiment.id,
            learnerId: learner.id,
            variantKey: "warm"
        }
    });
    await prisma.feedback.create({
        data: {
            tenantId,
            learnerId: learner.id,
            userId: teacherUser.id,
            targetType: "content",
            targetId: literacyTopic.id,
            role: "teacher",
            rating: 5,
            label: "engagement",
            comment: "Learner stayed focused with the warm prompt.",
            experimentId: experiment.id,
            experimentKey: experiment.key,
            variantKey: "warm"
        }
    });
    return {
        guardian: { id: guardianUser.id, username: guardianUser.username },
        admin: { id: adminUser.id, username: adminUser.username },
        teacher: { id: teacherUser.id, username: teacherUser.username },
        learner: { id: learner.id, userId: learnerUser.id, firstName: learner.firstName },
        classId: homeroom.id
    };
}
async function seedLearnerAccommodationPlan(prisma, learnerId, accommodations) {
    const client = prisma.learnerAccommodation;
    if (!client) {
        console.warn("[seed] LearnerAccommodation model unavailable; skipping plan creation");
        return;
    }
    const metadata = {
        seeded: true,
        rationale: "Demo defaults for Sam"
    };
    await client.upsert({
        where: { learnerId },
        create: {
            learnerId,
            accommodations,
            autoEnabled: true,
            autoEnabledAt: new Date("2025-01-05T00:00:00.000Z"),
            metadata
        },
        update: {
            accommodations,
            autoEnabled: true,
            autoEnabledAt: new Date("2025-01-05T00:00:00.000Z"),
            metadata
        }
    });
}
async function seedAccommodationEffectiveness(prisma, learnerId, sessionId) {
    const client = prisma.accommodationEffectiveness;
    if (!client) {
        console.warn("[seed] AccommodationEffectiveness model unavailable; skipping effectiveness metrics");
        return;
    }
    await client.createMany({
        data: [
            {
                learnerId,
                accommodation: client_1.AccommodationType.FREQUENT_BREAKS,
                sessionId,
                engagementWith: 0.78,
                completionRateWith: 0.9,
                accuracyWith: 0.82,
                metadata: {
                    scenario: "reading_session",
                    note: "Movement break every 7 minutes"
                }
            },
            {
                learnerId,
                accommodation: client_1.AccommodationType.CHUNKED_CONTENT,
                sessionId,
                engagementWith: 0.74,
                completionRateWith: 0.88,
                accuracyWith: 0.8,
                metadata: {
                    scenario: "chunked_passage",
                    note: "4 segments with check-ins"
                }
            }
        ]
    });
}
async function clearDatabase(prisma) {
    await prisma.approvalRequest.deleteMany();
    await deleteIfExists(() => prisma.feedback.deleteMany());
    await deleteIfExists(() => prisma.experimentAssignment.deleteMany());
    await deleteIfExists(() => prisma.experiment.deleteMany());
    await deleteIfExists(() => prisma.contentItem.deleteMany());
    await deleteIfExists(() => prisma.curriculumTopic.deleteMany());
    await prisma.assignment.deleteMany();
    await prisma.enrollment.deleteMany();
    await prisma.class.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.session.deleteMany();
    await prisma.personalizedModel.deleteMany();
    await prisma.assessmentDomain.deleteMany();
    await prisma.assessment.deleteMany();
    await prisma.iEPGoal.deleteMany();
    await prisma.diagnosis.deleteMany();
    await prisma.progress.deleteMany();
    await prisma.focusData.deleteMany();
    await prisma.gameSession.deleteMany();
    await prisma.learningSession.deleteMany();
    await prisma.learner.deleteMany();
    await prisma.profile.deleteMany();
    await prisma.user.deleteMany();
}
async function deleteIfExists(operation) {
    try {
        await operation();
    }
    catch (error) {
        if (error?.code === "P2021") {
            return;
        }
        throw error;
    }
}
