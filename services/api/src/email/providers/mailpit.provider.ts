import { Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

import { EmailPayload, EmailProvider } from '../email-provider.interface';

/**
 * Dev-only SMTP provider that delivers to Mailpit
 * (https://github.com/axllent/mailpit). Inspect captured mail in a browser
 * at http://localhost:8025 — nothing leaves the developer's machine.
 */
export class MailpitProvider implements EmailProvider {
  private readonly logger = new Logger(MailpitProvider.name);
  private readonly transport: nodemailer.Transporter;

  constructor(
    private readonly host: string,
    private readonly port: number,
    private readonly from: string,
  ) {
    this.transport = nodemailer.createTransport({
      host: this.host,
      port: this.port,
      secure: false,
      // Mailpit accepts anything; auth-allow-insecure is set in docker-compose.
      auth: undefined,
    });
  }

  async send(payload: EmailPayload): Promise<void> {
    await this.transport.sendMail({
      from: this.from,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    });
    this.logger.log(`Sent "${payload.subject}" to ${payload.to} (Mailpit)`);
  }
}
