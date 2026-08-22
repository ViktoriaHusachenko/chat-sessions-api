const base = 'http://localhost:3000';

async function main() {
  const createRes = await fetch(`${base}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-4o-mini', title: 'Demo session' }),
  });

  const created = await createRes.json();
  console.log('CREATE');
  console.log(JSON.stringify(created, null, 2));

  const id = created.id;

  const msgRes = await fetch(`${base}/sessions/${id}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: 'Hello! Please summarize the session history.' }),
  });

  const messageData = await msgRes.json();
  console.log('MESSAGE');
  console.log(JSON.stringify(messageData, null, 2));

  const sessionRes = await fetch(`${base}/sessions/${id}`);
  const sessionData = await sessionRes.json();
  console.log('SESSION');
  console.log(JSON.stringify(sessionData, null, 2));

  const historyRes = await fetch(`${base}/sessions/${id}/messages?page=1&limit=10`);
  const historyData = await historyRes.json();
  console.log('HISTORY');
  console.log(JSON.stringify(historyData, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
