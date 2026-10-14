import { afterEach, expect, test, vi } from 'vitest';
import { api } from './http.js';
afterEach(() => vi.unstubAllGlobals());
test('returns parsed API data', async () => {
  vi.stubGlobal('document', { cookie: '' });
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 })),
  );
  await expect(api('/health')).resolves.toEqual({ ok: true });
});
test('returns a safe server error message', async () => {
  vi.stubGlobal('document', { cookie: '' });
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: { message: 'No access' } }), {
        status: 403,
      }),
    ),
  );
  await expect(api('/private')).rejects.toThrow('No access');
});
