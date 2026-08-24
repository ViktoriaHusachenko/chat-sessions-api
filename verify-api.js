const base = 'http://localhost:3000';

async function request(path, options) {
  const response = await fetch(`${base}${path}`, options);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(`${response.status}: ${data.error?.message || 'Request failed'}`);
  }
  return data;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Verification failed: ${message}`);
  }
}

async function main() {
  const created = await request('/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-4o-mini', title: 'Demo session' }),
  });
  console.log('CREATE');
  console.log(JSON.stringify(created, null, 2));

  const id = created.id;
  assert(id && created.title === 'Demo session', 'session was not created correctly');

  const firstMessage = await request(`/sessions/${id}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: 'Hello! Please summarize the session history.' }),
  });
  const secondMessage = await request(`/sessions/${id}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: 'Give one more short detail.' }),
  });
  assert(firstMessage.assistantMessage?.model === 'gpt-4o-mini', 'default model was not stored');
  assert(secondMessage.assistantMessage?.model === 'gpt-4o-mini', 'session model was not used by default');

  const beforeReset = await request(`/sessions/${id}`);
  const historyBeforeReset = await request(`/sessions/${id}/messages?page=1&limit=10`);
  assert(historyBeforeReset.messages.length === 4, 'two interactions should create four messages');
  assert(beforeReset.total_tokens > 0 && beforeReset.total_cost > 0, 'session totals were not accumulated');

  const reset = await request(`/sessions/${id}/reset`, { method: 'POST' });
  assert(reset.id === id && reset.title === created.title && reset.model === created.model, 'reset changed session metadata');
  assert(reset.total_tokens === 0 && reset.total_cost === 0, 'reset did not clear totals');

  const afterReset = await request(`/sessions/${id}`);
  const historyAfterReset = await request(`/sessions/${id}/messages?page=1&limit=10`);
  assert(afterReset.id === id && historyAfterReset.messages.length === 0, 'reset did not remove old messages');

  const selectedModelMessage = await request(`/sessions/${id}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: 'Use the selected model.', model: 'gpt-4o' }),
  });
  assert(selectedModelMessage.assistantMessage?.model === 'gpt-4o', 'selected model was not stored');

  console.log('VERIFY OK: create, two messages, reset, empty history, selected model');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
