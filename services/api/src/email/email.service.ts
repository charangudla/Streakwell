import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { EmailPayload, EmailProvider } from './email-provider.interface';
import { MailpitProvider } from './providers/mailpit.provider';
import { ResendProvider } from './providers/resend.provider';

const DEFAULT_FROM = 'Vital30 <no-reply@vital30.local>';

/**
 * Provider-agnostic email sender. Switches between Mailpit (dev) and
 * Resend (production) based on the `EMAIL_PROVIDER` env var.
 *
 * Better Auth calls `send()` from its `sendResetPassword` and
 * `sendVerificationEmail` callbacks; no other call site in the app
 * should need it.
 */
@Injectable()
export class EmailService implements OnModuleInit, EmailProvider {
  private readonly logger = new Logger(EmailService.name);
  private provider!: EmailProvider;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const providerName =
      this.config.get<string>('EMAIL_PROVIDER')?.toLowerCase() ?? 'mailpit';
    const from = this.config.get<string>('EMAIL_FROM') ?? DEFAULT_FROM;

    if (providerName === 'resend') {
      this.provider = new ResendProvider(
        this.config.get<string>('RESEND_API_KEY') ?? '',
        from,
      );
      this.logger.log(`Email provider: Resend (from=${from})`);
      return;
    }

    if (providerName !== 'mailpit') {
      this.logger.warn(
        `Unknown EMAIL_PROVIDER=${providerName}, falling back to Mailpit.`,
      );
    }
    const host = this.config.get<string>('MAILPIT_HOST') ?? 'localhost';
    const port = Number(this.config.get<string>('MAILPIT_PORT') ?? 1025);
    this.provider = new MailpitProvider(host, port, from);
    this.logger.log(`Email provider: Mailpit (${host}:${port}, from=${from})`);
  }

  send(payload: EmailPayload): Promise<void> {
    return this.provider.send(payload);
  }
}
