const express = require('express');
const path = require('path');
const config = require('./config/env');
const { initializeDatabase } = require('./repositories/database');
const sessionRoutes = require('./routes/sessionRoutes');
const { errorHandler } = require('./middleware/errorHandler');

initializeDatabase();

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/', (req, res) => {
  res.json({
    service: 'chat-sessions-api',
    status: 'ok',
    routes: {
      health: '/health',
      sessions: '/sessions',
      createSession: 'POST /sessions',
      sendMessage: 'POST /sessions/:id/messages',
      resetSession: 'POST /sessions/:id/reset',
      sessionHistory: 'GET /sessions/:id/messages',
      sessionDetails: 'GET /sessions/:id',
      tester: '/tester.html',
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'chat-sessions-api' });
});

app.use('/sessions', sessionRoutes);

app.use((req, res) => {
  res.status(404).json({ error: { message: 'Route not found' } });
});

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Chat Sessions API listening on http://localhost:${config.port}`);
});
