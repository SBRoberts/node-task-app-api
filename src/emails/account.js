const sgMail = require("@sendgrid/mail");

const sendgridApiKey = process.env.SENDGRID_API_KEY;

sgMail.setApiKey(sendgridApiKey);

const sendWelcomeEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: "spencerrca@gmail.com",
    subject: "Welcome to the club!",
    text: `Hey there ${name}, let me know how you're getting along with the app!`
  });
};
const sendCancelEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: "spencerrca@gmail.com",
    subject: "Take care, all the best ☺️",
    text: `Hi ${name}, we're sorry to see you go! If there is anything we could have done better, feel free to let us know`
  });
};

module.exports = {
  sendWelcomeEmail,
  sendCancelEmail
};
