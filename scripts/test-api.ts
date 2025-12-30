
const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('Starting functional tests against ' + BASE_URL);

  let success = true;
  const fail = (msg: string) => {
    console.error(`❌ ${msg}`);
    success = false;
  };
  const pass = (msg: string) => console.log(`✅ ${msg}`);

  // 1. Health Check
  try {
    const res = await fetch(`${BASE_URL}/api/healthz`);
    if (res.status === 200) {
      const data = await res.json();
      if (data.ok) pass('Health check passed');
      else fail('Health check returned ok: false');
    } else {
      fail(`Health check failed with status ${res.status}`);
    }
  } catch (e) {
    fail(`Health check network error: ${e}`);
    return;
  }

  // 2. Paste Creation & Retrieval
  let pasteId: string | null = null;
  let pasteUrl: string | null = null;
  const content = "Hello World " + Date.now();

  try {
    const res = await fetch(`${BASE_URL}/api/pastes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });
    if (res.status === 201) {
      const data = await res.json();
      pasteId = data.id;
      pasteUrl = data.url;
      if (pasteId && pasteUrl) pass('Create paste passed');
      else fail('Create paste returned missing id or url');
    } else {
      fail(`Create paste failed with status ${res.status}`);
    }
  } catch (e) {
    fail(`Create paste error: ${e}`);
  }

  if (pasteId) {
    // Fetch API
    const res = await fetch(`${BASE_URL}/api/pastes/${pasteId}`);
    if (res.status === 200) {
      const data = await res.json();
      if (data.content === content) pass('Fetch paste API passed');
      else fail('Fetch paste API returned wrong content');
    } else {
      fail(`Fetch paste API failed with status ${res.status}`);
    }

    // View HTML
    const htmlRes = await fetch(`${BASE_URL}/p/${pasteId}`);
    if (htmlRes.status === 200) {
      const text = await htmlRes.text();
      if (text.includes(content)) pass('View paste HTML passed');
      else fail('View paste HTML missing content');
    } else {
      fail(`View paste HTML failed with status ${htmlRes.status}`);
    }
  }

  // 3. View Limits
  // Create paste with max_views = 2
  // 1st fetch (API) -> 200
  // 2nd fetch (API) -> 200
  // 3rd fetch (API) -> 404

  try {
    const res = await fetch(`${BASE_URL}/api/pastes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Limited', max_views: 2 })
    });
    const { id } = await res.json();

    const r1 = await fetch(`${BASE_URL}/api/pastes/${id}`);
    if (r1.status === 200) pass('View limit 1/2 passed');
    else fail(`View limit 1/2 failed status ${r1.status}`);

    const r2 = await fetch(`${BASE_URL}/api/pastes/${id}`);
    if (r2.status === 200) pass('View limit 2/2 passed');
    else fail(`View limit 2/2 failed status ${r2.status}`);

    const r3 = await fetch(`${BASE_URL}/api/pastes/${id}`);
    if (r3.status === 404) pass('View limit 3/2 (expected 404) passed');
    else fail(`View limit 3/2 failed (expected 404, got ${r3.status})`);

  } catch (e) {
    fail(`View limit test error: ${e}`);
  }

  // 4. TTL
  // Create paste with ttl_seconds = 60
  // Verify available
  // Send header x-test-now-ms = future
  // Verify 404
  try {
    const now = Date.now();
    const res = await fetch(`${BASE_URL}/api/pastes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'TTL Test', ttl_seconds: 60 })
    });
    const { id } = await res.json();

    const r1 = await fetch(`${BASE_URL}/api/pastes/${id}`);
    if (r1.status === 200) pass('TTL pre-expiry passed');
    else fail('TTL pre-expiry failed');

    // Future time = now + 61 seconds
    const future = now + 61000;
    const r2 = await fetch(`${BASE_URL}/api/pastes/${id}`, {
      headers: { 'x-test-now-ms': future.toString() }
    });

    // Note: To make this work, the server must be running with TEST_MODE=1
    // If it's not, this test will fail (it will return 200).
    // We will assume the user runs the server with TEST_MODE=1 for this test.
    if (r2.status === 404) pass('TTL post-expiry (simulated) passed');
    else fail(`TTL post-expiry failed (expected 404, got ${r2.status}). Is TEST_MODE=1 enabled?`);

  } catch (e) {
    fail(`TTL test error: ${e}`);
  }

  if (!success) {
    console.error('Some tests failed.');
    process.exit(1);
  } else {
    console.log('All tests passed!');
  }
}

runTests();
