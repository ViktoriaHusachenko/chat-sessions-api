const { readStore } = require('../repositories/database');
const { DatabaseError, ValidationError } = require('../utils/errors');

function getModelPricing(model) {
  try {
    const store = readStore();
    const row = store.model_pricing.find((pricing) => pricing.model === model);
    if (!row) {
      throw new ValidationError(`Model "${model}" is not supported or has no pricing configured.`);
    }
    return row;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new DatabaseError('Failed to load model pricing', { model, message: error.message });
  }
}

function calculateCost(model, promptTokens, completionTokens) {
  if (!model) {
    throw new Error('Model is required');
  }

  const pricing = getModelPricing(model);
  const promptCost = ((Number(promptTokens || 0) / 1000) * Number(pricing.input_price_per_1k));
  const completionCost = ((Number(completionTokens || 0) / 1000) * Number(pricing.output_price_per_1k));
  return Number((promptCost + completionCost).toFixed(12));
}

module.exports = {
  getModelPricing,
  calculateCost,
};
