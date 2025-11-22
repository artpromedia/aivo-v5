import { Server as SocketIOServer, type Socket } from "socket.io";
import { prisma } from "@/lib/prisma";
import { sendNotification } from "@/lib/notifications";
import { AIInsightGenerator } from "@/lib/ai/insight-generator";
import type { AnnouncementPriority, CommunicationLogType, MessageType, Prisma } from "@prisma/client";

interface SendMessagePayload {
  from: string;
  to: string;
  message: string;
  type?: MessageType | string;
  learnerId?: string;
  metadata?: Record<string, unknown>;
}

interface InsightRequestPayload {
  learnerId: string;
  topic: string;
  requesterId: string;
}

interface ScheduleCallPayload {
  participants: string[];
  scheduledTime: string;
  topic: string;
  duration?: number;
  createdBy?: string;
}

interface AnnouncementInput {
  title: string;
  content: string;
  recipients: string[];
  priority: AnnouncementPriority;
  createdBy?: string;
}

export class CommunicationHub {
  private io: SocketIOServer;
  private aiInsights: AIInsightGenerator;
  private activeConnections: Map<string, string> = new Map();

  constructor(io: SocketIOServer) {
    this.io = io;
    this.aiInsights = new AIInsightGenerator();
    this.setupSocketHandlers();
  }

  private setupSocketHandlers() {
    this.io.on("connection", (socket) => {
      socket.on("authenticate", async (data) => {
        const { userId } = data ?? {};
        if (!userId) return;
        this.activeConnections.set(userId, socket.id);
        await this.joinUserRooms(socket, userId);
      });

      socket.on("sendMessage", async (data: SendMessagePayload) => {
        await this.handleMessage(data, socket);
      });

      socket.on("requestInsight", async (data: InsightRequestPayload) => {
        await this.generateAndSendInsight(data, socket);
      });

      socket.on("scheduleCall", async (data: ScheduleCallPayload) => {
        await this.scheduleVideoCall(data, socket);
      });

      socket.on("typing", ({ to, isTyping }: { to?: string; isTyping?: boolean }) => {
        const recipientSocket = to ? this.activeConnections.get(to) : undefined;
        if (recipientSocket) {
          this.io.to(recipientSocket).emit("userTyping", {
            userId: socket.data.userId,
            isTyping: Boolean(isTyping)
          });
        }
      });

      socket.on("disconnect", () => {
        for (const [userId, socketId] of this.activeConnections.entries()) {
          if (socketId === socket.id) {
            this.activeConnections.delete(userId);
            break;
          }
        }
      });
    });
  }

  private async joinUserRooms(socket: Socket, userId: string) {
    socket.data.userId = userId;
    socket.join(`user:${userId}`);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { learners: { select: { id: true } } }
    });

    if (!user) return;

    for (const learner of user.learners) {
      socket.join(`learner:${learner.id}`);
    }
  }

  private async handleMessage(data: SendMessagePayload, socket: Socket) {
    if (!data?.from || !data?.to || !data.message?.trim()) return;

    const savedMessage = await prisma.message.create({
      data: {
        fromId: data.from,
        toId: data.to,
        learnerId: data.learnerId,
        type: (data.type as MessageType) ?? "TEXT",
        content: data.message,
        metadata: data.metadata as Prisma.InputJsonValue
      },
      include: {
        fromUser: { select: { id: true, username: true, role: true } }
      }
    });

    await this.recordLog({
      channel: "socket",
      type: "MESSAGE",
      userId: data.from,
      learnerId: data.learnerId,
      payload: savedMessage
    });

    const recipientSocketId = this.activeConnections.get(data.to);
    if (recipientSocketId) {
      this.io.to(recipientSocketId).emit("newMessage", savedMessage);
    } else {
      await this.sendOfflineNotification(data.to, savedMessage.id, data.message);
    }

    if (savedMessage.type === "CONCERN" || savedMessage.type === "QUESTION") {
      const insight = await this.aiInsights.generateContextualInsight({
        message: data.message,
        learnerId: data.learnerId,
        context: "parent_teacher_communication"
      });

      socket.emit("aiInsight", insight);
      await this.recordLog({
        channel: "ai",
        type: "INSIGHT",
        userId: data.from,
        learnerId: data.learnerId,
        payload: insight
      });
    }

    return savedMessage;
  }

  async generateAndSendInsight(data: InsightRequestPayload, socket?: Socket) {
    if (!data.learnerId) return;
    const learner = await prisma.learner.findUnique({
      where: { id: data.learnerId },
      include: {
        progress: { orderBy: { date: "desc" }, take: 30 },
        assessments: { orderBy: { createdAt: "desc" }, take: 1 }
      }
    });

    const insight = await this.aiInsights.generateComprehensiveInsight({
      learner: learner
        ? {
            ...learner,
            focusData: [],
            assessments: learner.assessments,
            progress: learner.progress
          }
        : null,
      topic: data.topic,
      requesterId: data.requesterId
    });

    const saved = await prisma.aIInsight.create({
      data: {
        learnerId: data.learnerId,
        requesterId: data.requesterId,
        generatedForId: data.requesterId,
        type: data.topic,
        summary: insight.summary,
  content: insight as unknown as Prisma.InputJsonValue,
  recommendations: insight.recommendations as unknown as Prisma.InputJsonValue,
        priority: insight.priority
      }
    });

  socket?.emit("insightGenerated", insight);
    await this.recordLog({
      channel: "ai",
      type: "INSIGHT",
      userId: data.requesterId,
      learnerId: data.learnerId,
      payload: saved
    });

    if (insight.priority === "HIGH") {
      this.broadcastToStakeholders(data.learnerId, "urgentInsight", insight);
    }
  }

  async scheduleVideoCall(data: ScheduleCallPayload, socket?: Socket) {
    if (!data.participants?.length) return;
    const meetingRoom = await this.createVideoRoom({
      participants: data.participants,
      scheduledTime: data.scheduledTime,
      duration: data.duration
    });

    const meeting = await prisma.meeting.create({
      data: {
        roomId: meetingRoom.id,
        roomLink: meetingRoom.link,
        topic: data.topic,
        scheduledTime: new Date(data.scheduledTime),
        duration: data.duration,
        createdById: data.createdBy,
        participants: {
          create: data.participants.map((participantId) => ({ userId: participantId }))
        }
      },
      include: { participants: true }
    });

    await this.recordLog({
      channel: "video",
      type: "MEETING",
      userId: data.createdBy,
      payload: meeting
    });

    await Promise.all(
      data.participants.map((participantId) =>
        this.emailMeetingInvite(participantId, {
          topic: data.topic,
          scheduledTime: data.scheduledTime,
          duration: data.duration,
          meetingLink: meetingRoom.link
        })
      )
    );

    socket?.emit("meetingScheduled", { meeting, roomLink: meetingRoom.link });
  }

  private broadcastToStakeholders(learnerId: string, event: string, payload: unknown) {
    this.io.to(`learner:${learnerId}`).emit(event, payload);
  }

  async sendAnnouncement(announcement: AnnouncementInput) {
    const saved = await prisma.announcement.create({
      data: {
        title: announcement.title,
        content: announcement.content,
        priority: announcement.priority,
        recipients: announcement.recipients,
        createdById: announcement.createdBy
      }
    });

    await this.recordLog({
      channel: "announcement",
      type: "ANNOUNCEMENT",
      userId: announcement.createdBy,
      payload: saved
    });

    for (const userId of announcement.recipients) {
      const socketId = this.activeConnections.get(userId);
      if (socketId) {
        this.io.to(socketId).emit("announcement", saved);
      }
    }

    if (announcement.priority === "HIGH") {
      const users = await prisma.user.findMany({
        where: { id: { in: announcement.recipients } }
      });

      await Promise.all(
        users
          .filter((user) => Boolean(user.email))
          .map((user) =>
            sendNotification({
              userId: user.id,
              to: user.email!,
              subject: `Important: ${announcement.title}`,
              template: "announcement",
              data: { content: announcement.content, priority: announcement.priority },
              channel: "EMAIL"
            })
          )
      );
    }

    return saved;
  }

  private async sendOfflineNotification(userId: string, messageId: string, excerpt: string) {
    const preference = await prisma.notificationPreference.findUnique({ where: { userId } });
    if (preference?.muteUntil && preference.muteUntil > new Date()) {
      return;
    }

    await this.recordLog({
      channel: "notification",
      type: "NOTIFICATION",
      userId,
      payload: { messageId, excerpt }
    });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.email) return;

    await sendNotification({
      userId,
      to: user.email,
      subject: "New message waiting in Aivo Communication Hub",
      template: "message-alert",
      data: { excerpt, messageId },
      channel: "EMAIL"
    });
  }

  private async emailMeetingInvite(userId: string, payload: Record<string, unknown>) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.email) return;

    await sendNotification({
      userId,
      to: user.email,
      subject: `Scheduled Meeting: ${payload.topic}`,
      template: "meeting-invite",
      data: payload,
      channel: "EMAIL"
    });
  }

  private async recordLog(params: {
    userId?: string;
    learnerId?: string;
    type: CommunicationLogType | "MESSAGE" | "MEETING" | "INSIGHT" | "ANNOUNCEMENT" | "NOTIFICATION";
    channel: string;
    payload: unknown;
  }) {
    await prisma.communicationLog.create({
      data: {
        userId: params.userId,
        learnerId: params.learnerId,
        type: params.type as CommunicationLogType,
        channel: params.channel,
        payload: params.payload as Prisma.InputJsonValue
      }
    });
  }

  private async createVideoRoom({
    participants,
    scheduledTime,
    duration
  }: {
    participants: string[];
    scheduledTime: string;
    duration?: number;
  }) {
    const roomId = `room_${Date.now()}`;
    const baseUrl = process.env.VIDEO_CONFERENCING_BASE_URL ?? "https://meet.jit.si";
    const slug = `${roomId}-${participants.length}`;
    const link = `${baseUrl.replace(/\/$/, "")}/${slug}`;
    return { id: roomId, link, duration, scheduledTime };
  }
}
