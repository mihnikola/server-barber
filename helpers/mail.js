const { default: axios } = require("axios");
const { API_CALLS } = require("./callApiFb");

const sendEmail = async (receipients) => {
 
  const functionUrl = API_CALLS.sendMailApi;
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
      console.error("Greška pri slanju emaila:", err);
      alert("Greška pri slanju emaila: " + err);
    });
};

module.exports = { sendEmail };
