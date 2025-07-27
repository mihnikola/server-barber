const sendEmail = async (receipients) => {
  const functionUrl = "https://us-central1-barberappointmentapp-85deb.cloudfunctions.net/sendMail"; 

  try {
    const response = await fetch(functionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: receipients.receipients,
        subject: receipients.subject,
        html: receipients.message,
        text: receipients.message,
      }),
    });

    if (response.ok) {
      console.log("Email je uspešno poslat!");
    } else {
      const errorText = await response.text();
      console.error("Greška pri slanju emaila:", errorText);
    }
  } catch (error) {
    console.error("Došlo je do greške u mreži:", error);
  }
};


module.exports = { sendEmail };
