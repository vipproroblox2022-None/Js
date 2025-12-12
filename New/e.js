// server.js
const http = require('http');
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// Serve app.html as the front-end
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'app.html'));
});

// Claude proxy route
app.post('/api/claude', async (req, res) => {
  const { messages } = req.body;
  try {
    // Replace with actual Claude API call
    const reply = `Echo: ${messages[messages.length - 1].content}`;
    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Claude request failed' });
  }
});

const PORT = process.env.PORT || 8080;
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});