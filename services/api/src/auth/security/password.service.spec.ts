import { PasswordService } from './password.service';

describe('PasswordService', () => {
  const service = new PasswordService();

  it('hashes passwords without storing the plaintext value', async () => {
    const hash = await service.hashPassword('correct-horse-battery-staple');

    expect(hash).not.toBe('correct-horse-battery-staple');
    expect(hash).toMatch(/^\$2[aby]\$/);
  });

  it('verifies valid and invalid passwords', async () => {
    const hash = await service.hashPassword('valid-password');

    await expect(service.verifyPassword('valid-password', hash)).resolves.toBe(
      true,
    );
    await expect(service.verifyPassword('wrong-password', hash)).resolves.toBe(
      false,
    );
  });
});
