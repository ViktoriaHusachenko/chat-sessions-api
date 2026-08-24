const { randomUUID } = require('crypto');
const { readStore, writeStore } = require('./database');
const { DatabaseError, NotFoundError } = require('../utils/errors');

function createSession({ title, model }) {
  try {
    const store = readStore();
    const id = randomUUID();
    const now = new Date().toISOString();
    const session = {
      id,
      title: title || null,
      model,
      total_tokens: 0,
      total_cost: 0,
      created_at: now,
      updated_at: now,
    };

    store.sessions.push(session);
    writeStore(store);
    return session;
  } catch (error) {
    throw new DatabaseError('Failed to create session', { message: error.message });
  }
}

function getSessionById(sessionId) {
  const store = readStore();
  const row = store.sessions.find((session) => session.id === sessionId);
  if (!row) {
    throw new NotFoundError('Session not found');
  }
  return row;
}

function resetSession(sessionId) {
  try {
    const store = readStore();
    const sessionIndex = store.sessions.findIndex((session) => session.id === sessionId);
    if (sessionIndex === -1) {
      throw new NotFoundError('Session not found');
    }

    store.messages = store.messages.filter((message) => message.session_id !== sessionId);
    store.sessions[sessionIndex].total_tokens = 0;
    store.sessions[sessionIndex].total_cost = 0;
    store.sessions[sessionIndex].updated_at = new Date().toISOString();
    writeStore(store);
    return store.sessions[sessionIndex];
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('Failed to reset session', { message: error.message });
  }
}

function updateSessionTotals(sessionId, additionalTokens, additionalCost) {
  try {
    const store = readStore();
    const index = store.sessions.findIndex((session) => session.id === sessionId);
    if (index === -1) {
      throw new NotFoundError('Session not found');
    }

    store.sessions[index].total_tokens = Number(store.sessions[index].total_tokens) + Number(additionalTokens || 0);
    store.sessions[index].total_cost = Number(store.sessions[index].total_cost) + Number(additionalCost || 0);
    store.sessions[index].updated_at = new Date().toISOString();
    writeStore(store);
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('Failed to update session totals', { message: error.message });
  }
}

module.exports = {
  createSession,
  getSessionById,
  resetSession,
  updateSessionTotals,
};
