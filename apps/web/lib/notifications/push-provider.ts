/**
 * Push Notification Provider
 * 
 * Handles sending push notifications via Firebase Cloud Messaging (FCM)
 * and Apple Push Notification Service (APNs)
 */

export interface PushNotificationPayload {
  token: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  badge?: number;
  sound?: string;
}

export interface PushNotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send push notification to a device
 * 
 * Uses Firebase Admin SDK when configured, falls back to mock in development
 */
export async function sendPushNotification(
  payload: PushNotificationPayload
): Promise<PushNotificationResult> {
  const firebaseProjectId = process.env.FIREBASE_PROJECT_ID;
  const firebaseServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

  // If Firebase is not configured, log and return success in development
  if (!firebaseProjectId || !firebaseServiceAccount) {
    if (process.env.NODE_ENV === "development") {
      console.info("[push-provider] Mock push notification:", {
        token: payload.token.slice(0, 20) + "...",
        title: payload.title,
        body: payload.body,
      });
      return { success: true, messageId: `mock-${Date.now()}` };
    }
    
    console.warn("[push-provider] Firebase not configured, push notification skipped");
    return { success: false, error: "Firebase not configured" };
  }

  try {
    // Dynamic import to avoid errors when firebase-admin is not installed
    const admin = await import("firebase-admin");

    // Initialize Firebase Admin if not already initialized
    if (!admin.apps.length) {
      const serviceAccount = JSON.parse(firebaseServiceAccount);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: firebaseProjectId,
      });
    }

    const message = {
      token: payload.token,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data ? stringifyDataValues(payload.data) : undefined,
      apns: {
        payload: {
          aps: {
            badge: payload.badge,
            sound: payload.sound || "default",
          },
        },
      },
      android: {
        priority: "high" as const,
        notification: {
          sound: payload.sound || "default",
          channelId: "aivo_notifications",
        },
      },
    };

    const response = await admin.messaging().send(message);

    console.info("[push-provider] Push notification sent:", {
      messageId: response,
      token: payload.token.slice(0, 20) + "...",
    });

    return { success: true, messageId: response };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[push-provider] Push notification failed:", errorMessage);

    // Check for invalid token errors
    if (
      errorMessage.includes("registration-token-not-registered") ||
      errorMessage.includes("invalid-registration-token")
    ) {
      // Token is invalid, should be removed from database
      console.warn("[push-provider] Invalid token detected, should be removed");
    }

    return { success: false, error: errorMessage };
  }
}

/**
 * Send push notification to multiple devices
 */
export async function sendPushNotificationToMultiple(
  tokens: string[],
  payload: Omit<PushNotificationPayload, "token">
): Promise<{ successCount: number; failureCount: number; results: PushNotificationResult[] }> {
  const results = await Promise.all(
    tokens.map((token) => sendPushNotification({ ...payload, token }))
  );

  return {
    successCount: results.filter((r) => r.success).length,
    failureCount: results.filter((r) => !r.success).length,
    results,
  };
}

/**
 * Convert data values to strings (FCM requirement)
 */
function stringifyDataValues(data: Record<string, unknown>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(data)) {
    result[key] = typeof value === "string" ? value : JSON.stringify(value);
  }
  return result;
}

/**
 * Validate a push token format
 */
export function isValidPushToken(token: string): boolean {
  // FCM tokens are typically ~150-200 characters
  // APNs device tokens are 64 hex characters
  if (!token || token.length < 32) return false;
  
  // Basic validation - tokens should be alphanumeric with some special chars
  return /^[a-zA-Z0-9_:\-]+$/.test(token);
}

/**
 * Register or update a user's push token
 */
export async function registerPushToken(
  userId: string,
  token: string,
  platform: "ios" | "android" | "web"
): Promise<boolean> {
  const { prisma } = await import("@/lib/prisma");

  if (!isValidPushToken(token)) {
    console.warn("[push-provider] Invalid push token format");
    return false;
  }

  try {
    await prisma.notificationPreference.upsert({
      where: { userId },
      update: {
        pushToken: token,
        updatedAt: new Date(),
      },
      create: {
        userId,
        pushToken: token,
        emailEnabled: true,
        pushEnabled: true,
        inAppEnabled: true,
      },
    });

    console.info("[push-provider] Push token registered:", {
      userId,
      platform,
      tokenPrefix: token.slice(0, 20) + "...",
    });

    return true;
  } catch (error) {
    console.error("[push-provider] Failed to register push token:", error);
    return false;
  }
}

/**
 * Unregister a user's push token
 */
export async function unregisterPushToken(userId: string): Promise<boolean> {
  const { prisma } = await import("@/lib/prisma");

  try {
    await prisma.notificationPreference.update({
      where: { userId },
      data: { pushToken: null },
    });

    console.info("[push-provider] Push token unregistered:", { userId });
    return true;
  } catch (error) {
    console.error("[push-provider] Failed to unregister push token:", error);
    return false;
  }
}
