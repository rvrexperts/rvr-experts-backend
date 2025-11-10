const express = require("express");
const nodeMailer = require("nodemailer");
require("dotenv").config();
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const job = require("./cron");

const app = express();
const PORT = 3005;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
job.start();


const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

//Dummy Url for Cron Jobs

app.get("/", async (req, res) => {
  res.send("Cron Jobs Restarting the Server every 14 Minutes");
});

app.post("/contact-form", async (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  const { firstName, lastName, mobileNumber, email, subject, message } =
    req.body;

  const receiverTemplatePath = path.join(
    __dirname,
    "/receiverContactTemplate.html"
  );

  try {
    const receiverTemplate = fs.readFileSync(receiverTemplatePath, "utf-8");
    const receiverContactContent = receiverTemplate.replace(
      "{{name}}",
      firstName
    );

    const adminMsg = {
      from: process.env.ADMIN_MAIL,
      to: process.env.ADMIN_MAIL,
      subject: "Contact Form Submission",
      html: `
     <p> <strong>Contact Form</strong></p>
      <p><strong>First Name:</strong> ${firstName}</p>
      <p><strong>Last Name:</strong> ${lastName}</p>
      <p><strong>Mobile Number:</strong> ${mobileNumber}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Message:</strong> ${message}</p>
      
    `,
    };

    const userMsg = {
      from: process.env.ADMIN_MAIL,
      to: email,
      subject: "Thank You for Your Submission",
      html: receiverContactContent,
    };

    await sgMail.send(adminMsg);
    await sgMail.send(userMsg);
    res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    console.error("Failed to send email:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
