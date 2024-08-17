

import React, { useState } from 'react';

// Define types for the state values
interface FormState {
  email: string;
  subject: string;
  message: string;
}

function App() {
  // Initialize state with TypeScript types
  const [email, setEmail] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  const sendNotification = async (): Promise<void> => {
    try {
      const response = await fetch('http://localhost:3001/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to: email, subject, text: message }),
      });

      if (response.ok) {
        alert('Email request sent to SQS!');
      } else {
        alert('Failed to send email request.');
      }
    } catch (error) {
      alert('Error sending email request.');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Send Notification</h1>
      <div>
        <input
          type="email"
          placeholder="Recipient Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <input
          type="text"
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
      </div>
      <div>
        <textarea
          placeholder="Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>
      <button onClick={sendNotification}>Send Email</button>
    </div>
  );
}

export default App;
