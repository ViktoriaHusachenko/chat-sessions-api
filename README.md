# Chat Sessions API

Minimal REST API for managing chat sessions with OpenAI, a lightweight JSON-file data store, usage tracking, and per-model pricing.

## Model and pricing

The implementation uses OpenAI model `gpt-4o-mini` and the following public pricing assumptions:

- Input: $0.15 per 1M tokens = $0.00015 per 1K tokens
- Output: $0.60 per 1M tokens = $0.00060 per 1K tokens

These values are stored in the `model_pricing` collection in the JSON store and can be updated without changing code. The cost formula is:

`totalCost = (promptTokens / 1000) * inputPricePer1k + (completionTokens / 1000) * outputPricePer1k`

If the OpenAI SDK returns additional usage categories in future (for example cached or reasoning tokens), they are not included in the current cost calculation and are intentionally ignored for this MVP because the base `prompt_tokens` and `completion_tokens` values are sufficient for session-level billing.

## Features

- Create a chat session
- Send a user message and receive an assistant reply from OpenAI
- Include relevant session history when calling OpenAI
- Store user and assistant messages with token usage, model, and cost in a JSON file
- Maintain session totals for `total_tokens` and `total_cost`
- Return session history with accumulated cost
- Basic input validation and centralized error handling

## Stack

- Node.js
- Express
- OpenAI SDK
- JSON file database for the local MVP (non-relational storage)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env
```

3. Set your OpenAI key in `.env` if you want to use the live API:

```env
PORT=3000
DATABASE_PATH=./data/chat_sessions.json
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
SESSION_CONTEXT_LIMIT=20
```

If `OPENAI_API_KEY` is missing or still contains a placeholder value, the app automatically switches to a local demo response so the full REST flow can still be tested without external API access.

4. Start the server:

```bash
npm start
```

The server initializes the JSON data store automatically on startup.

## API endpoints

### 1) Create a session

```http
POST /sessions
Content-Type: application/json
```

Body:

```json
{
  "model": "gpt-4o-mini",
  "title": "Test session"
}
```

Example:

```bash
curl -X POST http://localhost:3000/sessions \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-4o-mini","title":"Test session"}'
```

### 2) Send a message to a session

```http
POST /sessions/:id/messages
Content-Type: application/json
```

Body:

```json
{
  "content": "Hello! Can you summarize the project plan?",
  "model": "gpt-4o-mini"
}
```

`model` is optional. When omitted, the session's base model is used. The model must have a pricing entry in `model_pricing`; otherwise the API returns `400` before calling OpenAI. The assistant message stores the model actually used, and its cost uses that model's tariff.

Example:

```bash
curl -X POST http://localhost:3000/sessions/<session_id>/messages \
  -H "Content-Type: application/json" \
  -d '{"content":"Hello! Can you summarize the project plan?"}'
```

Response includes the user message, assistant reply, usage values, and per-interaction cost.

### 3) Reset a session

```http
POST /sessions/:id/reset
```

Reset keeps the same session ID, title, and base model. It physically deletes all messages belonging to the session and sets `total_tokens` and `total_cost` to zero. A later `GET /sessions/:id/messages` returns an empty list.

Example:

```bash
curl -X POST http://localhost:3000/sessions/<session_id>/reset
```

### 4) Read session metadata

```http
GET /sessions/:id
```

Example:

```bash
curl http://localhost:3000/sessions/<session_id>
```

### 5) Read session messages/history

```http
GET /sessions/:id/messages
```

Example:

```bash
curl "http://localhost:3000/sessions/<session_id>/messages?page=1&limit=50"
```

## Database

The project uses a simple JSON file storage for the MVP, which keeps the project runnable without native database builds. On startup it initializes a local data file with:

- `sessions`
- `messages`
- `model_pricing`

The default pricing entries are seeded automatically if the collection is empty. The file is rewritten for each mutation; interaction messages and session totals are persisted together in one write, and reset removes old message records from the file.

## Known limitations / intentionally not implemented

- No authentication or user ownership model
- No streaming responses
- No summarization or long-context compression beyond the last `SESSION_CONTEXT_LIMIT` messages
- No automatic admin UI for price updates
- No robust retry policy beyond simple OpenAI error mapping for this MVP

## Notes

This is intentionally a minimal working implementation for a test or demo backend. It follows the requested architecture with separate service, repository, and middleware layers while keeping the project simple to run locally.
