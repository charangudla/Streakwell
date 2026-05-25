import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from './domain/user-role.enum';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './security/jwt-payload';
import { PasswordService } from './security/password.service';

export type AuthResponse = {
  token: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    role: UserRole;
  };
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const passwordHash = await this.passwords.hashPassword(dto.password);
    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email.toLowerCase(),
          name: dto.name.trim(),
          passwordHash,
        },
        select: { id: true, email: true, name: true, role: true },
      });
      return this.buildAuthResponse(user);
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException(
          'An account with this email already exists.',
        );
      }
      throw e;
    }
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const record = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        passwordHash: true,
      },
    });
    // Always run a hash comparison even on misses to keep response times
    // similar — frustrates account-enumeration timing attacks.
    const fallbackHash =
      record?.passwordHash ??
      '$2b$12$0000000000000000000000000000000000000000000000000000aa';
    const ok = await this.passwords.verifyPassword(dto.password, fallbackHash);

    if (!record || !ok) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    return this.buildAuthResponse({
      id: record.id,
      email: record.email,
      name: record.name,
      role: record.role,
    });
  }

  private buildAuthResponse(user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
  }): AuthResponse {
    const role = user.role as UserRole;
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role,
    };
    return {
      token: this.jwt.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role,
      },
    };
  }
}
