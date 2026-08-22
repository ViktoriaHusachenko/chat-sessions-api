const OpenAI = require('openai');
const config = require('../config/env');
const { OpenAIError } = require('../utils/errors');

const client = new OpenAI({
  apiKey: config.openAiApiKey,
});

function shouldUseDemoFallback() {
  return !config.openAiApiKey || config.openAiApiKey.includes('placeholder') || config.openAiApiKey === 'sk-test';
}

async function createChatCompletion({ messages, model }) {
  if (shouldUseDemoFallback()) {
    const lastUserMessage = [...messages].reverse().find((message) => message.role === 'user');
    const demoReply = lastUserMessage
      ? `Demo mode response: received "${lastUserMessage.content}" and used the session history for context.`
      : 'Demo mode response: OpenAI key is not configured, so this is a local fallback reply.';

    return {
      content: demoReply,
      usage: {
        prompt_tokens: 32,
        completion_tokens: 18,
        total_tokens: 50,
      },
      model: model || config.openAiModel,
    };
  }

  try {
    const response = await client.chat.completions.create({
      model: model || config.openAiModel,
      messages,
      temperature: 0.7,
    });

    const choice = response.choices?.[0];
    if (!choice || !choice.message) {
      throw new OpenAIError('OpenAI returned an empty response.', 502);
    }

    return {
      content: choice.message.content || '',
      usage: response.usage || null,
      model: response.model || model || config.openAiModel,
    };
  } catch (error) {
    if (error instanceof OpenAIError) {
      throw error;
    }

    const message = error?.message || 'OpenAI request failed';
    const statusCode = error?.status === 429 ? 429 : 502;
    throw new OpenAIError(message, { status: error?.status, type: error?.type }, statusCode);
  }
}

module.exports = {
  createChatCompletion,
};
