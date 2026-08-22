const fs = require('fs');
const path = require('path');
const config = require('../config/env');

const dbPath = path.resolve(process.cwd(), config.databasePath);
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const defaultPricing = [
  {
    model: 'gpt-4o-mini',
    input_price_per_1k: 0.00015,
    output_price_per_1k: 0.0006,
    effective_from: '2024-01-01T00:00:00.000Z',
  },
  {
    model: 'gpt-4o',
    input_price_per_1k: 0.000005,
    output_price_per_1k: 0.000015,
    effective_from: '2024-01-01T00:00:00.000Z',
  },
];

function readStore() {
  if (!fs.existsSync(dbPath)) {
    const initial = { sessions: [], messages: [], model_pricing: defaultPricing };
    fs.writeFileSync(dbPath, JSON.stringify(initial, null, 2));
    return initial;
  }

  try {
    const content = fs.readFileSync(dbPath, 'utf8');
    const parsed = JSON.parse(content);
    return {
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
      model_pricing: Array.isArray(parsed.model_pricing) && parsed.model_pricing.length ? parsed.model_pricing : defaultPricing,
    };
  } catch (error) {
    throw new Error(`Unable to read data store: ${error.message}`);
  }
}

function writeStore(store) {
  fs.writeFileSync(dbPath, JSON.stringify(store, null, 2));
}

function initializeDatabase() {
  const store = readStore();
  if (!store.model_pricing || store.model_pricing.length === 0) {
    store.model_pricing = defaultPricing;
    writeStore(store);
  }
  return store;
}

module.exports = {
  readStore,
  writeStore,
  initializeDatabase,
  defaultPricing,
};
