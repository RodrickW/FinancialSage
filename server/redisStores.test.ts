import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from 'redis';
import { RedisStore } from 'connect-redis';
import { createSessionStore, createRateLimitStore, redisNamespace } from './redisStores';

test('production cannot fall back to memory sessions or limits', () => {
  const disconnected = { isReady: false, sendCommand: async () => null };
  assert.throws(() => createSessionStore(disconnected, 'production'), /Redis must be ready/);
  for (const scope of ['general', 'auth', 'plaid'] as const) {
    assert.throws(() => createRateLimitStore(disconnected, scope, 'production'), /Redis must be ready/);
    assert.equal(createRateLimitStore(disconnected, scope, 'development'), undefined);
  }
});

test('session store uses the installed Redis constructor and environment isolation', () => {
  const ready = { isReady: true, sendCommand: async () => null };
  const production = createSessionStore(ready, 'production') as RedisStore;
  const development = createSessionStore(ready, 'development') as RedisStore;
  assert.ok(production instanceof RedisStore);
  assert.equal(production.prefix, `${redisNamespace('production')}sess:`);
  assert.notEqual(production.prefix, development.prefix);
  assert.equal(production.ttl, 604800);
});

test('rate limit scopes have independent counters and expirations', () => {
  const ready = { isReady: true, sendCommand: async () => null };
  const stores = ['general', 'auth', 'plaid'].map(scope =>
    createRateLimitStore(ready, scope as 'general', 'production')!);
  assert.equal(new Set(stores.map(store => store.prefix)).size, 3);
  assert.ok(stores.every(store => store.prefix.startsWith(redisNamespace('production'))));
});

test('live Redis shares sessions and limits across independent clients', {
  skip: process.env.RUN_REDIS_INTEGRATION !== '1',
}, async () => {
  const clients = [0, 1].map(() => createClient({
    url: process.env.REDIS_URL,
    socket: { connectTimeout: 8000, reconnectStrategy: false },
  }));
  for (const client of clients) client.on('error', () => {});
  const prefix = `${redisNamespace()}verification:${crypto.randomUUID()}:`;
  const keys: string[] = [];
  try {
    await Promise.all(clients.map(client => client.connect()));
    assert.equal(await clients[0].ping(), 'PONG');
    const first = createSessionStore(clients[0]) as RedisStore;
    const second = createSessionStore(clients[1]) as RedisStore;
    // Unique prefixes avoid all real user sessions, counters and billing data.
    first.prefix = second.prefix = `${prefix}sess:`;
    keys.push(`${prefix}sess:fixture`);
    const fixture: any = { cookie: { maxAge: 60000, expires: new Date(Date.now() + 60000) }, verification: true };
    await new Promise<void>((resolve, reject) =>
      first.set('fixture', fixture, error => error ? reject(error) : resolve()));
    const ttl = await clients[1].ttl(keys[0]);
    assert.ok(ttl > 0 && ttl <= 60);
    await clients[0].quit();
    const retrieved: any = await new Promise((resolve, reject) =>
      second.get('fixture', (error, data) => error ? reject(error) : resolve(data)));
    assert.equal(retrieved.verification, true, 'session must survive the first connection closing');
    await clients[0].connect();

    const general1 = createRateLimitStore(clients[0], 'general')!;
    const general2 = createRateLimitStore(clients[1], 'general')!;
    const auth = createRateLimitStore(clients[1], 'auth')!;
    general1.prefix = general2.prefix = `${prefix}general:`;
    auth.prefix = `${prefix}auth:`;
    keys.push(`${prefix}general:fixture`, `${prefix}auth:fixture`);
    for (const store of [general1, general2, auth]) store.init({ windowMs: 60000 } as any);
    assert.equal((await general1.increment('fixture')).totalHits, 1);
    assert.equal((await general2.increment('fixture')).totalHits, 2);
    assert.equal((await auth.increment('fixture')).totalHits, 1, 'auth must not share the general counter');
    const rateTtl = await clients[0].pTTL(`${prefix}general:fixture`);
    assert.ok(rateTtl > 0 && rateTtl <= 60000);
  } finally {
    const open = clients.find(client => client.isReady);
    if (open && keys.length) await open.del(keys);
    await Promise.all(clients.map(client => client.isOpen ? client.quit() : Promise.resolve()));
  }
});
