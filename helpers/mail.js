const { default: axios } = require("axios");

const sendEmail = async (receipients) => {
  const functionUrl =
    "https://us-central1-barberappointmentapp-85deb.cloudfunctions.net/sendMail";

  await axios
    .post(functionUrl, {
      to: receipients.receipients,
      subject: receipients.subject,
      html: receipients.message,
      text: receipients.message,
    })
    .then((res) => {
      console.log("solve", res.data.message);
      console.log("Email je uspešno poslat!");
    })
    .catch((err) => {
      console.log("err", err);
      console.error("Greška pri slanju emaila:", errorText);
    });
};

module.exports = { sendEmail };
