import webpush from "web-push";
import { prisma } from "./prisma";

// Configure web-push with VAPID keys
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        "mailto:noreply@woodledger.com", // This should be a real email in production
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

interface PushPayload {
    title: string;
    body: string;
    url?: string;
}

export async function sendPushNotification(userId: string, payload: PushPayload) {
    try {
        // Get all subscriptions for this user
        const subscriptions = await prisma.pushSubscription.findMany({
            where: { userId },
        });

        if (subscriptions.length === 0) return;

        const results = await Promise.allSettled(
            subscriptions.map(async (sub) => {
                const pushSubscription = {
                    endpoint: sub.endpoint,
                    keys: {
                        p256dh: sub.p256dh,
                        auth: sub.auth,
                    },
                };

                try {
                    await webpush.sendNotification(pushSubscription, JSON.stringify(payload));
                } catch (error: any) {
                    // If subscription is expired or invalid, remove it from DB
                    if (error.statusCode === 404 || error.statusCode === 410) {
                        await prisma.pushSubscription.delete({
                            where: { id: sub.id },
                        });
                    }
                    throw error;
                }
            })
        );

        return results;
    } catch (error) {
        console.error("Error sending push notifications:", error);
    }
}
