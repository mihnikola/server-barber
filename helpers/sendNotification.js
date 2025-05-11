pushNotificationHour

export const pushNotificationHour = async (message, tokenExpo) => {
  console.log("pushNotificationHour", message);
  try {
    // Fetch all stored tokens from MongoDB
    // const tokens = await Token.findOne({token: tokenExpo});

    // Prepare push notifications payload for each token
    let messages = [];
    // for (let token of tokens) {
    if (Expo.isExpoPushToken(tokenExpo)) {
      messages.push({
        to: tokenExpo, // Expo push token
        sound: "default",
        body: message,
      });
    } else {
      console.log(`Invalid Expo push token: ${tokenExpo}`);
    }
    // }

    if (messages.length > 0) {
      // Send notifications through Expo's service
      const chunks = expo.chunkPushNotifications(messages);
      const tickets = [];

      for (let chunk of chunks) {
        try {
          const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          console.error(error);
        }
      }

      console.log("Push notifications sent:", tickets);
      return "Notification sent successfully";
    } else {
      console.log("No valid Expo");
      return "No valid Expo tokens found";
    }
  } catch (error) {
    console.error("Error sending notification:", error);
    return `Error sending notification: ${error}`;
  }
};
