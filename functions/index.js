import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { onRequest } from "firebase-functions/https";

admin.initializeApp({
  projectId: "barberappointmentapp-85deb",
});

const EXPRESS_SERVER_URL = "https://server-barber-admin-dev.vercel.app"; // Replace with your actual URL

const db = getFirestore();

export const sendNotificationRequest = onRequest(async (request, response) => {
  const { reservationIds } = request.body;
  try {
    console.log("reservationIds",reservationIds)
    const tasksSnapshots = await Promise.all(
      reservationIds.map(async (reservationId) => {
        const tasksSnapshot = await db
          .collection("tasks")
          .where("reservationId", "==", reservationId)
          .get();
        return tasksSnapshot;
      })
    );
    const allTasks = tasksSnapshots.flatMap((snapshot) =>
      snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    );

    if (allTasks.length === 0) {
      return response.status(404).send(`No appointments`);
    }

    /*
    for every tasks I have reservationId and token how to send that
    await sendNotification(tokenExpo, title, messageData, data);
*/

    // Send a notification for each task
    await Promise.all(
      allTasks.map(async (task) => {
        const { token } = task;

        // Skip if no tokenExpo
        if (!tokenExpo) return;

        await sendNotification(
          token,
          "New Notification",
          "Izvini brate... pije mi se kava"
        );
      })
    );

    return response.status(200).send(`Successfully send notifications.`);
  } catch (error) {
    console.error("Error sending appointments: ", error);
    return response
      .status(500)
      .send(`Error sending appointments: ${error.message}`);
  }
});

const sendNotification = async (tokenExpo, title, messageData) => {
  try {
    await axios
      .post(`${EXPRESS_SERVER_URL}/api/send`, {
        token: tokenExpo,
        title: title,
        content: messageData,
      })
      .then((res) => {
        console.log("Notification sent successfully", res);
        // alert("Notification sent successfully");
      })
      .catch((err) => {
        console.error("Failed to send notification", err);
        // alert("Failed to send notification");
      });
  } catch (er) {
    console.log("error od catch", er);
  }
  console.log("Successfully updated all scheduled tasks to finished.");
};
