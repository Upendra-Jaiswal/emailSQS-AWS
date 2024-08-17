const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const helmet = require('helmet');
const cors = require('cors');

dotenv.config();
const app = express();

app.use(bodyParser.json());
app.use(cors());

// Set up AWS SQS
const sqs = new SQSClient({
  region: 'ap-southeast-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: [
          "'self'",
          'http://127.0.0.1:8000',
          'ws://localhost:42877/',
        ],
      },
    },
  })
);

app.post('/send-email', async (req, res) => {
  const emailOptions = {
    from: process.env.EMAIL_PRIMARY_USER,
    to: req.body.to,
    subject: req.body.subject,
    text: req.body.text,
  };

  // Send email request to SQS
  const params = {
    MessageBody: JSON.stringify(emailOptions),
    QueueUrl: process.env.SQS_QUEUE_URL,
  };

  try {
    const command = new SendMessageCommand(params);
    await sqs.send(command);
    res.send('Email request sent to SQS');
  } catch (error) {
    console.error('Error sending message to SQS:', error);
    res.status(500).send('Failed to send email request to SQS');
  }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
