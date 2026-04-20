// Firebase Cloud Messaging service for push notifications
// Requires firebase-admin SDK: npm install firebase-admin

let admin = null;

function getFirebaseAdmin() {
  if (admin) return admin;
  if (!process.env.FIREBASE_PROJECT_ID) {
    console.log("[FCM] Firebase not configured — push notifications disabled");
    return null;
  }
  try {
    admin = require("firebase-admin");
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
      });
    }
    return admin;
  } catch (error) {
    console.log("[FCM] firebase-admin not installed — push notifications disabled");
    return null;
  }
}

async function sendPushNotification({ token, title, body, data = {} }) {
  const firebase = getFirebaseAdmin();
  if (!firebase || !token) return;

  try {
    await firebase.messaging().send({
      token,
      notification: { title, body },
      data,
      android: { priority: "high" },
    });
    console.log(`[FCM] Push sent: ${title} → ${token.substring(0, 20)}...`);
  } catch (error) {
    console.error("[FCM] Push failed:", error.message);
  }
}

async function sendToAdmins(prisma, { title, body, data = {} }) {
  try {
    const admins = await prisma.user.findMany({
      where: { role: "admin", fcm_token: { not: null } },
      select: { fcm_token: true },
    });

    for (const admin of admins) {
      await sendPushNotification({ token: admin.fcm_token, title, body, data });
    }
  } catch (error) {
    console.error("[FCM] sendToAdmins error:", error.message);
  }
}

module.exports = { sendPushNotification, sendToAdmins };
