import test from 'node:test';
import assert from 'node:assert/strict';
import { AppError } from '../src/utils/AppError.js';
test('AppError preserves safe API metadata', () => {
  const error = new AppError(403, 'FORBIDDEN', 'No access');
  assert.equal(error.status, 403);
  assert.equal(error.code, 'FORBIDDEN');
});
