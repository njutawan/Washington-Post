/** Real production HTTP checks; caller provisions PostgreSQL and builds first. */
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { request } from 'node:http';
import { randomBytes } from 'node:crypto';
import { Client } from 'pg';
import assert from 'node:assert/strict';
export async function checkProductionHttp(databaseUrl: string, tenant: string) {
  const free = createServer();
  await new Promise<void>((r) => free.listen(0, '127.0.0.1', r));
  const port = (free.address() as { port: number }).port;
  await new Promise<void>((r) => free.close(() => r()));
  let logs = '';
  let started = false;
  const child = spawn(
    process.execPath,
    [
      'scripts/start-production.mjs',
      '--hostname',
      '127.0.0.1',
      '--port',
      String(port),
    ],
    {
      env: {
        ...process.env,
        NODE_ENV: 'production',
        NEXT_PHASE: '',
        DATABASE_URL: databaseUrl,
        APP_TENANT_ID: tenant,
        NEXTAUTH_URL: 'https://audit.invalid',
        AUTH_URL: 'https://audit.invalid',
        NEXTAUTH_SECRET: randomBytes(48).toString('hex'),
        NEXT_PUBLIC_SITE_URL: 'https://audit.invalid',
        ALLOW_SIGNUP: 'true',
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: '',
        CLERK_SECRET_KEY: '',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  const ready = new Promise<void>((resolve, reject) => {
    const t = setTimeout(
      () => reject(Error('Production HTTP fixture timed out')),
      30000,
    );
    const onData = (chunk: Buffer) => {
      logs += String(chunk);
      if (!started && logs.includes('Ready in')) {
        started = true;
        clearTimeout(t);
        resolve();
      }
    };
    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    child.on('error', (e) => {
      clearTimeout(t);
      reject(e);
    });
    child.on('exit', () => {
      if (!started) {
        clearTimeout(t);
        reject(Error('Production runtime failed to start'));
      }
    });
  });
  type Jar = Map<string, string>;
  const rawCall = (route: string, options: RequestInit = {}) =>
    new Promise<Response>((resolve, reject) => {
      const headers = Object.fromEntries(new Headers(options.headers));
      const body = options.body?.toString();
      if (body) headers['content-length'] = String(Buffer.byteLength(body));
      const r = request(
        {
          hostname: '127.0.0.1',
          port,
          path: route,
          method: options.method || 'GET',
          headers,
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on('data', (chunk) => chunks.push(chunk));
          res.on('end', () => {
            const h = new Headers();
            for (const [k, v] of Object.entries(res.headers)) {
              if (Array.isArray(v)) for (const item of v) h.append(k, item);
              else if (v) h.set(k, v);
            }
            resolve(
              new Response(new Uint8Array(Buffer.concat(chunks)), {
                status: res.statusCode || 500,
                headers: h,
              }),
            );
          });
        },
      );
      r.on('error', reject);
      if (body) r.write(body);
      r.end();
    });
  const call = async (
    path: string,
    options: RequestInit = {},
    jar: Jar = new Map(),
  ) => {
    const headers = new Headers(options.headers);
    headers.set('host', 'audit.invalid');
    headers.set('cookie', [...jar].map(([k, v]) => k + '=' + v).join('; '));
    if (options.method && options.method !== 'GET')
      headers.set('origin', 'https://audit.invalid');
    const r = await rawCall(path, { ...options, headers, redirect: 'manual' });
    for (const cookie of r.headers.getSetCookie()) {
      const item = cookie.split(';')[0];
      const eq = item.indexOf('=');
      jar.set(item.slice(0, eq), item.slice(eq + 1));
    }
    return r;
  };
  try {
    await ready;
    const anonymous = await call('/api/analytics/stats');
    assert.equal(anonymous.status, 401);
    await anonymous.text();
    const signUp = async (email: string, jar: Jar) => {
      const csrf = await call('/api/auth/csrf', {}, jar);
      const { csrfToken } = (await csrf.json()) as { csrfToken: string };
      const body = new URLSearchParams({
        csrfToken,
        email,
        password: 'production-http-test-passphrase',
        mode: 'signup',
        name: 'HTTP Test',
        callbackUrl: 'https://audit.invalid/account',
      });
      const r = await call(
        '/api/auth/callback/credentials',
        {
          method: 'POST',
          headers: {
            'content-type': 'application/x-www-form-urlencoded',
            'x-auth-return-redirect': '1',
          },
          body,
        },
        jar,
      );
      assert.ok(r.status === 200 || r.status === 302, 'sign up response');
      await r.text();
      const session = await call('/api/auth/session', {}, jar);
      const data = (await session.json()) as { user?: { id?: string } };
      assert.ok(data.user?.id, 'signed-in session must exist');
      return data.user!.id!;
    };
    const a: Jar = new Map(),
      b: Jar = new Map();
    const idA = await signUp('http-a@example.invalid', a);
    const idB = await signUp('http-b@example.invalid', b);
    assert.notEqual(idA, idB);
    assert.ok(
      [...a.keys()].some((k) => k.startsWith('__Secure-authjs.session-token')),
    );
    assert.equal((await call('/api/analytics/stats', {}, a)).status, 403);
    const roleClient = new Client({ connectionString: databaseUrl });
    await roleClient.connect();
    await roleClient.query(
      `UPDATE app_documents SET value=jsonb_set(value,'{users}',
      (SELECT jsonb_agg(CASE WHEN u->>'id'=$2 THEN jsonb_set(u,'{role}','"editor"'::jsonb) ELSE u END)
       FROM jsonb_array_elements(value->'users') u)) WHERE tenant_id=$1 AND key='accounts'`,
      [tenant, idA],
    );
    await roleClient.end();
    assert.equal(
      (await call('/api/analytics/stats', {}, a)).status,
      200,
      'fresh editor role on existing session',
    );

    const write = await call(
      '/api/bookmarks/http-private',
      { method: 'POST' },
      a,
    );
    assert.equal(write.status, 200, 'bookmark write');
    await write.text();
    const own = (await (await call('/api/bookmarks', {}, a)).json()) as {
      bookmarks: string[];
    };
    const other = (await (await call('/api/bookmarks', {}, b)).json()) as {
      bookmarks: string[];
    };
    assert.ok(own.bookmarks.includes('http-private'));
    assert.equal(other.bookmarks.includes('http-private'), false);
    for (const route of [
      '/api/analytics/collect',
      '/api/push/subscribe',
      '/api/newsletters',
    ]) {
      const r = await call(
        route,
        {
          method: route.endsWith('newsletters') ? 'PUT' : 'POST',
          headers: { 'content-type': 'application/json' },
          body: 'null',
        },
        a,
      );
      assert.equal(r.status, 400, route);
      await r.text();
    }
    const invalid = await call('/api/analytics/collect', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{',
    });
    assert.equal(invalid.status, 400);
    await invalid.text();
    const oversized = await call('/api/analytics/collect', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url: '/', props: { payload: 'x'.repeat(9000) } }),
    });
    assert.equal(oversized.status, 413);
    await oversized.text();
    const csrf = await rawCall('/api/bookmarks/csrf-check', {
      method: 'POST',
      headers: {
        host: 'audit.invalid',
        origin: 'https://evil.invalid',
        cookie: [...a].map(([k, v]) => k + '=' + v).join('; '),
      },
    });
    assert.equal(csrf.status, 403);
    await csrf.text();
    const wrongHost = await rawCall('/api/push/key');
    assert.equal(wrongHost.status, 421);
    await wrongHost.text();
    const foreign = await call('/api/analytics/stats', {
      headers: { origin: 'https://evil.invalid' },
    });
    assert.equal(foreign.headers.get('access-control-allow-origin'), null);
    await foreign.text();
    assert.equal(logs.includes('production-http-test-passphrase'), false);
    for (const overrides of [
      {
        env: { NEXTAUTH_SECRET: '' },
        expected: 'Strong NEXTAUTH_SECRET required',
      },
      {
        env: { NEXTAUTH_URL: 'http://not-https.invalid' },
        expected: 'NEXTAUTH_URL must be a canonical HTTPS origin',
      },
      {
        env: { CLERK_SECRET_KEY: 'retired-provider-fixture' },
        expected: 'Clerk is not supported',
      },
    ]) {
      let failureLog = '';
      const bad = spawn(
        process.execPath,
        [
          'scripts/start-production.mjs',
          '--hostname',
          '127.0.0.1',
          '--port',
          '0',
        ],
        {
          env: {
            ...process.env,
            NODE_ENV: 'production',
            NEXT_PHASE: '',
            DATABASE_URL: databaseUrl,
            APP_TENANT_ID: tenant,
            NEXTAUTH_URL: 'https://audit.invalid',
            AUTH_URL: '',
            NEXTAUTH_SECRET: randomBytes(48).toString('hex'),
            CLERK_SECRET_KEY: '',
            NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: '',
            ...overrides.env,
          },
          stdio: ['ignore', 'pipe', 'pipe'],
        },
      );
      bad.stdout.on('data', (chunk) => {
        failureLog += String(chunk);
      });
      bad.stderr.on('data', (chunk) => {
        failureLog += String(chunk);
      });
      const code = await new Promise<number | null>((resolve, reject) => {
        const timer = setTimeout(() => {
          bad.kill('SIGKILL');
          reject(Error('Invalid production config did not fail startup'));
        }, 15000);
        bad.on('error', (e) => {
          clearTimeout(timer);
          reject(e);
        });
        bad.on('exit', (status) => {
          clearTimeout(timer);
          resolve(status);
        });
      });
      assert.notEqual(
        code,
        0,
        'invalid runtime configuration must stop the server',
      );
      assert.ok(
        failureLog.includes(overrides.expected),
        'startup must fail for the expected configuration invariant',
      );
    }
    console.log(
      'PASS production startup fails closed for missing secret, insecure canonical origin and retired Clerk configuration',
    );

    console.log(
      'PASS production HTTP: real credentials/signup sessions, two-account bookmark isolation, stats 401/403/200, null/malformed 400, bytes 413, CSRF 403, Host 421, CORS deny, Secure cookie',
    );
  } finally {
    child.kill('SIGTERM');
    await new Promise<void>((resolve) => {
      if (child.exitCode !== null) return resolve();
      const timer = setTimeout(() => child.kill('SIGKILL'), 5000);
      child.once('exit', () => {
        clearTimeout(timer);
        resolve();
      });
    });
  }
}
