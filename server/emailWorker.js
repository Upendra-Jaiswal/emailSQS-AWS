const {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} = require("@aws-sdk/client-sqs");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

dotenv.config();

// Configure AWS SDK
const sqs = new SQSClient({
  region: "ap-southeast-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const createTransporter = (user, pass) =>
  nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass,
    },
  });

const primaryTransporter = createTransporter(
  process.env.EMAIL_PRIMARY_USER,
  process.env.EMAIL_PRIMARY_PASS
);
const backupTransporter = createTransporter(
  process.env.EMAIL_BACKUP_USER,
  process.env.EMAIL_BACKUP_PASS
);

const MAX_RETRIES = 3;

const processMessages = async () => {
  const params = {
    QueueUrl: process.env.SQS_QUEUE_URL,
    MaxNumberOfMessages: 10,
    VisibilityTimeout: 20,
    WaitTimeSeconds: 0,
  };

  try {
    const command = new ReceiveMessageCommand(params);
    const data = await sqs.send(command);

    if (data.Messages) {
      for (const message of data.Messages) {
        const emailOptions = JSON.parse(message.Body);

        let retryCount = 0;
        let success = false;

        while (retryCount < MAX_RETRIES && !success) {
          try {
            const transporter =
              retryCount < MAX_RETRIES - 1
                ? primaryTransporter
                : backupTransporter;
            await transporter.sendMail(emailOptions);
            console.log("Email sent successfully");
            success = true;
          } catch (error) {
            retryCount += 1;
            console.error(
              `Error sending email (attempt ${retryCount}):`,
              error
            );
            if (retryCount >= MAX_RETRIES) {
              console.error("Failed to send email after multiple attempts.");
            }
          }
        }

        // Delete message from queue if processing is successful
        if (success) {
          const deleteParams = {
            QueueUrl: process.env.SQS_QUEUE_URL,
            ReceiptHandle: message.ReceiptHandle,
          };
          const deleteCommand = new DeleteMessageCommand(deleteParams);
          await sqs.send(deleteCommand);
        }
      }
    }
  } catch (error) {
    console.error("Error processing messages from SQS:", error);
  }
};

// Continuously poll the queue
setInterval(processMessages, 5000); // Poll every 5 seconds
