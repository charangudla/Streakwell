import { Logger } from '@nestjs/common';
import { Resend } from 'resend';

import { EmailPayload, EmailProvider } from '../email-provider.interface';

/**
 * Production provider backed by Resend (resend.com). Requires a verified
 * sender domain — set `EMAIL_FROM` to an address on that domain.
 */
export class ResendProvider implements EmailProvider {
  private readonly logger = new Logger(ResendProvider.name);
  private readonly client: Resend;

  constructor(
    apiKey: string,
    private readonly from: string,
  ) {
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is required when EMAIL_PROVIDER=resend.');
    }
    this.client = new Resend(apiKey);
  }

  async send(payload: EmailPayload): Promise<void> {
    const { error } = await this.client.emails.send({
      from: this.from,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html ?? payload.text,
    });
    if (error) {
      this.logger.error(`Resend send failed: ${error.message}`);
      throw new Error(`Resend send failed: ${error.message}`);
    }
    this.logger.log(`Sent "${payload.subject}" to ${payload.to} (Resend)`);
  }
}
