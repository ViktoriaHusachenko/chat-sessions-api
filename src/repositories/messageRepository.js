const { randomUUID } = require('crypto');
const { readStore, writeStore } = require('./database');
const { DatabaseError, NotFoundError } = require('../utils/errors');

function createMessage({ sessionId, role, content, model, promptTokens, completionTokens, totalTokens, cost }) {
  try {
    const store = readStore();
    const id = randomUUID();
    const createdAt = new Date().toISOString();
    const message = {
      id,
      session_id: sessionId,
      role,
      content,
      model: model || null,
      prompt_tokens: promptTokens ?? null,
      completion_tokens: completionTokens ?? null,
      total_tokens: totalTokens ?? null,
      cost: cost ?? null,
      created_at: createdAt,
    };

    store.messages.push(message);
    writeStore(store);
    return message;
  } catch (error) {
    throw new DatabaseError('Failed to create message', { message: error.message });
  }
}

function createInteractionMessagePair({ sessionId, userContent, assistantContent, model, promptTokens, completionTokens, totalTokens, cost }) {
  try {
    const store = readStore();
    const session = store.sessions.find((item) => item.id === sessionId);
    if (!session) {
      throw new NotFoundError('Session not found');
    }

    const sessionIndex = store.sessions.findIndex((item) => item.id === sessionId);
    const createdAt = new Date().toISOString();
    const userMessage = {
      id: randomUUID(),
      session_id: sessionId,
      role: 'user',
      content: userContent,
      model: null,
      prompt_tokens: null,
      completion_tokens: null,
      total_tokens: null,
      cost: null,
      created_at: createdAt,
    };

    const assistantMessage = {
      id: randomUUID(),
      session_id: sessionId,
      role: 'assistant',
      content: assistantContent,
      model,
      prompt_tokens: promptTokens ?? null,
      completion_tokens: completionTokens ?? null,
      total_tokens: totalTokens ?? null,
      cost: cost ?? null,
      created_at: new Date().toISOString(),
    };

    store.messages.push(userMessage, assistantMessage);
    store.sessions[sessionIndex].total_tokens = Number(store.sessions[sessionIndex].total_tokens) + Number(totalTokens || 0);
    store.sessions[sessionIndex].total_cost = Number(store.sessions[sessionIndex].total_cost) + Number(cost || 0);
    store.sessions[sessionIndex].updated_at = new Date().toISOString();
    writeStore(store);

    return { userMessage, assistantMessage };
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('Failed to persist interaction', { message: error.message });
  }
}

function getMessagesBySession(sessionId, { limit = 50, offset = 0 } = {}) {
  try {
    const store = readStore();
    const sessionMessages = store.messages
      .filter((message) => message.session_id === sessionId)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    return sessionMessages.slice(Number(offset), Number(offset) + Number(limit));
  } catch (error) {
    throw new DatabaseError('Failed to fetch messages', { message: error.message });
  }
}

function getMessageCount(sessionId) {
  try {
    const store = readStore();
    return store.messages.filter((message) => message.session_id === sessionId).length;
  } catch (error) {
    throw new DatabaseError('Failed to count messages', { message: error.message });
  }
}

module.exports = {
  createMessage,
  createInteractionMessagePair,
  getMessagesBySession,
  getMessageCount,
};
