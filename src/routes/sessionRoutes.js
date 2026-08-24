const express = require('express');
const { createNewSession, getSessionMetadata, resetSessionHistory, getSessionHistory, sendMessage } = require('../services/sessionService');
const { ValidationError } = require('../utils/errors');

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const payload = req.body || {};
    if (!payload || typeof payload !== 'object') {
      throw new ValidationError('Request body must be an object.');
    }

    const session = createNewSession(payload);
    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const session = getSessionMetadata(req.params.id);
    res.json(session);
  } catch (error) {
    next(error);
  }
});

router.get('/:id/messages', async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = getSessionHistory(req.params.id, page, limit);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/reset', async (req, res, next) => {
  try {
    const session = resetSessionHistory(req.params.id);
    res.json(session);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/messages', async (req, res, next) => {
  try {
    const payload = req.body || {};
    if (!payload || typeof payload !== 'object') {
      throw new ValidationError('Request body must be an object.');
    }

    const result = await sendMessage(req.params.id, payload);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
