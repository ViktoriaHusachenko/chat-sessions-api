const { db } = require('../repositories/database');
const { DatabaseError } = require('../utils/errors');

function getModelPricing(model) {
  try {
    const row = db.prepare('SELECT * FROM model_pricing WHERE model = ?').get(model);
    if (!row) {
      throw new Error(`No pricing found for model: ${model}`);
    }
    return row;
  } catch (error) {
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
