
import  admin from "firebase-admin";
import serviceAccount from "./barber-demo-218de-firebase-adminsdk-fbsvc-0f43d447e4.json" with { type: "json" };
import { v4 as uuidv4 } from 'uuid';

// Initialize Firebase Admin SDK with service account credentials
admin.initializeApp({
 projectId: "barber-demo-218de",
  credential: admin.credential.cert(serviceAccount),
});


const db = admin.firestore();  // Correct Firestore initialization

export const pushNotification = async (timeStampValue,tokenExpo) => {
  const uid = uuidv4(); // ⇨ '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d'

  const data = {
    status: "scheduled",
    performAt: timeStampValue,
    token: tokenExpo,
  };
  console.log("store pushNotification",data)

await db.collection("tasks").doc(uid).set(data).then((res) => {
    console.log('Added document with ID: ', res);
  });

  
 
};
