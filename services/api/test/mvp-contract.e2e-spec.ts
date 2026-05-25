describe('Vital30 MVP API contracts', () => {
  it.todo('auth register creates a user with a hashed password');
  it.todo('auth login returns a JWT for valid credentials');
  it.todo('protected routes reject anonymous requests');
  it.todo('admin routes reject non-admin users');
  it.todo('admin routes allow ADMIN and SUPER_ADMIN users');
  it.todo('challenge listing returns active challenges only');
  it.todo('joining a challenge creates one active user challenge per user');
  it.todo('daily check-in records one check-in per challenge day');
  it.todo('users cannot read another user challenge or check-in data');
});
