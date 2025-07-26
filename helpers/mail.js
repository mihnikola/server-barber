const nodemailer = require("nodemailer");

let transport = nodemailer.createTransport({
    host: "smtp.gmail.com", // ILI npr. 'smtp.gmail.com'
    port: 587,
    secure: false, // true za port 465 (SSL), false za 587 (TLS/STARTTLS)
    auth: {
        user: "fusiontechagent@gmail.com",
        pass: "eksl jnfc ujxx nuss"
    }
});

const sendEmail = async ({ receipients, subject, message }) => {
  return await transport.sendMail({
    from: "fusiontechagent@gmail.com",
    to: receipients,
    subject,
    text: message,
    html: message,
  });
};

module.exports = { sendEmail };
