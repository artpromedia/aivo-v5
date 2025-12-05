import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendEmailNotification } from "@/lib/notifications/email-provider";
import { renderNotificationTemplate } from "@/lib/notifications/templates";
import { sendPushNotification } from "@/lib/notifications/push-provider";

export interface NotificationPayload {
  userId?: string;
  learnerId?: string;
  to: string | undefined;
  subject: string;
  template: string;
  data: Record<string, unknown>;
  channel?: "EMAIL" | "IN_APP" | "PUSH";
}

export async function sendNotification(payload: NotificationPayload) {
  if (!payload.to && !payload.userId) {
    console.warn("Notification skipped: missing recipient", payload);
    return;
  }

  let user = null;
  if (payload.userId) {
    user = await prisma.user.findUnique({ where: { id: payload.userId } });
  } else if (payload.to) {
    user = await prisma.user.findFirst({ where: { email: payload.to } });
  } else if (payload.learnerId) {
    const learner = await prisma.learner.findUnique({ where: { id: payload.learnerId }, select: { guardianId: true } });
    if (learner) {
      user = await prisma.user.findUnique({ where: { id: learner.guardianId } });
    }
  }

  if (!user) {
    console.warn("Notification recipient not found", payload);
    return;
  }

  const metadata = payload.learnerId
    ? { learnerId: payload.learnerId, ...payload.data }
    : payload.data;

  const messageBody = (() => {
    const body = (payload.data as Record<string, unknown>).body;
    if (typeof body === "string") return body;
    const message = (payload.data as Record<string, unknown>).message;
    return typeof message === "string" ? message : payload.subject;
  })();

  const notification = await prisma.notification.create({
    data: {
      userId: user.id,
      learnerId: payload.learnerId,
      type: payload.template || payload.channel || "notification",
      title: payload.subject,
      message: messageBody,
      data: metadata as Prisma.InputJsonValue
    }
  });

  if (payload.channel === "EMAIL" && (payload.to ?? user.email)) {
    queueMicrotask(() =>
      deliverEmailNotification({
        notificationId: notification.id,
        to: payload.to ?? user.email!,
        subject: payload.subject,
        template: payload.template,
        data: metadata
      })
    );
  } else if (payload.channel === "PUSH") {
    // Deliver push notification if user has a push token
    queueMicrotask(() =>
      deliverPushNotification({
        notificationId: notification.id,
        userId: user.id,
        title: payload.subject,
        body: messageBody,
        data: metadata
      })
    );
  } else if (process.env.NODE_ENV === "development") {
    console.info("Notification stored without email delivery", payload);
  }
}

interface DeliveryPayload {
  notificationId: string;
  to: string;
  subject: string;
  template: string;
  data: Record<string, unknown>;
}

interface PushDeliveryPayload {
  notificationId: string;
  userId: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
}

async function deliverEmailNotification(payload: DeliveryPayload) {
  try {
    const { html, text } = renderNotificationTemplate(payload.template, payload.data);
    await sendEmailNotification({
      to: payload.to,
      subject: payload.subject,
      html,
      text
    });

    await prisma.notification.update({
      where: { id: payload.notificationId },
      data: {
        data: {
          ...payload.data,
          deliveredAt: new Date().toISOString()
        } as Prisma.InputJsonValue
      }
    });
  } catch (error) {
    console.error("Email delivery failed", error);
    await prisma.notification.update({
      where: { id: payload.notificationId },
      data: {
        data: {
          ...payload.data,
          deliveryError: error instanceof Error ? error.message : String(error),
          deliveryFailedAt: new Date().toISOString()
        } as Prisma.InputJsonValue
      }
    });
  }
}

async function deliverPushNotification(payload: PushDeliveryPayload) {
  try {
    // Get user's push tokens from notification preferences
    const preferences = await prisma.notificationPreference.findFirst({
      where: { userId: payload.userId }
    });

    const pushToken = preferences?.pushToken;

    if (!pushToken) {
      console.info("No push token for user", { userId: payload.userId });
      return;
    }

    await sendPushNotification({
      token: pushToken,
      title: payload.title,
      body: payload.body,
      data: payload.data
    });

    await prisma.notification.update({
      where: { id: payload.notificationId },
      data: {
        data: {
          ...payload.data,
          pushDeliveredAt: new Date().toISOString()
        } as Prisma.InputJsonValue
      }
    });
  } catch (error) {
    console.error("Push notification delivery failed", error);
    await prisma.notification.update({
      where: { id: payload.notificationId },
      data: {
        data: {
          ...payload.data,
          pushDeliveryError: error instanceof Error ? error.message : String(error),
          pushDeliveryFailedAt: new Date().toISOString()
        } as Prisma.InputJsonValue
      }
    });
  }
}
