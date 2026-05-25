import { describe, it } from 'vitest';

describe('future protected admin route contracts', () => {
  it.todo('redirects anonymous users to login');
  it.todo('rejects authenticated non-admin users');
  it.todo('allows ADMIN and SUPER_ADMIN users to view protected pages');
});
