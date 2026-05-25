import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

const DEFAULT_PASSWORD_COST = 12;

@Injectable()
export class PasswordService {
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, DEFAULT_PASSWORD_COST);
  }

  async verifyPassword(
    password: string,
    passwordHash: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, passwordHash);
  }
}
