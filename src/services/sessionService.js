const { getSessionById, createSession, resetSession } = require('../repositories/sessionRepository');
const { getMessagesBySession, createInteractionMessagePair } = require('../repositories/messageRepository');
const { createChatCompletion } = require('./openAIService');
const { calculateCost, getModelPricing } = require('./pricingService');
const { ValidationError } = require('../utils/errors');
const config = require('../config/env');

function validateSessionPayload(payload) {
  const model = payload?.model || config.openAiModel;
  if (!model || typeof model !== 'string') {
    throw new ValidationError('Model is required and must be a string.');
  }

  return {
    model,
    title: typeof payload?.title === 'string' ? payload.title.trim() : null,
  };
}

function createNewSession(payload) {
  const { model, title } = validateSessionPayload(payload);
  return createSession({ model, title });
}

function getSessionMetadata(sessionId) {
  return getSessionById(sessionId);
}

function resetSessionHistory(sessionId) {
  return resetSession(sessionId);
}

function getSessionHistory(sessionId, page = 1, limit = 50) {
  const safePage = Number(page) > 0 ? Number(page) : 1;
  const safeLimit = Number(limit) > 0 ? Number(limit) : 50;
  const offset = (safePage - 1) * safeLimit;

  const session = getSessionById(sessionId);
  const messages = getMessagesBySession(sessionId, { limit: safeLimit, offset });

  return {
    session,
    page: safePage,
    limit: safeLimit,
    messages,
  };
}

function buildContextMessages(historyMessages, limit = config.sessionContextLimit) {
  const safeLimit = Number(limit) > 0 ? Number(limit) : config.sessionContextLimit;
  const recent = historyMessages.slice(-safeLimit);

  return recent.map((message) => ({
    role: message.role,
    content: message.content,
  }));
}

async function sendMessage(sessionId, payload) {
  const content = typeof payload?.content === 'string' ? payload.content.trim() : '';
  if (!content) {
    throw new ValidationError('Message content is required.');
  }

  const session = getSessionById(sessionId);
  const requestedModel = payload?.model === undefined ? session.model : payload.model;
  if (typeof requestedModel !== 'string' || !requestedModel.trim()) {
    throw new ValidationError('Model must be a non-empty string.');
  }
  const model = requestedModel.trim();
  getModelPricing(model);

  const history = getMessagesBySession(sessionId, { limit: Number.MAX_SAFE_INTEGER, offset: 0 });
  const contextMessages = buildContextMessages(history, config.sessionContextLimit);

  const chatMessages = [
    ...contextMessages,
    { role: 'user', content },
  ];

  const response = await createChatCompletion({
    messages: chatMessages,
    model,
  });

  const usage = response.usage || {};
  const promptTokens = Number(usage.prompt_tokens || 0);
  const completionTokens = Number(usage.completion_tokens || 0);
  const totalTokens = Number(usage.total_tokens || (promptTokens + completionTokens));
  const usedModel = response.model || model;
  const cost = calculateCost(usedModel, promptTokens, completionTokens);

  const { userMessage, assistantMessage } = createInteractionMessagePair({
    sessionId,
    userContent: content,
    assistantContent: response.content,
    model: usedModel,
    promptTokens,
    completionTokens,
    totalTokens,
    cost,
  });

  const updatedSession = getSessionById(sessionId);

  return {
    session: updatedSession,
    userMessage,
    assistantMessage,
    usage: {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: totalTokens,
    },
    cost,
  };
}

module.exports = {
  createNewSession,
  getSessionMetadata,
  resetSessionHistory,
  getSessionHistory,
  sendMessage,
};
