const dotenv = require('dotenv');

dotenv.config();

module.exports = {
  port: Number(process.env.PORT || 3000),
  databasePath: process.env.DATABASE_PATH || './data/chat_sessions.json',
  openAiApiKey: process.env.OPENAI_API_KEY,
  openAiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  sessionContextLimit: Number(process.env.SESSION_CONTEXT_LIMIT || 20),
};
