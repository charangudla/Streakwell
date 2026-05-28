import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitContactDto } from './dto/submit-contact.dto';

@Injectable()
export class PublicContactService {
  private readonly logger = new Logger(PublicContactService.name);

  constructor(
    private readonly email: EmailService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Returns true if the message was queued for delivery, false if it
   * looks like spam (honeypot tripped) — controller responds 204 in
   * both cases so a bot can't tell the difference.
   */
  async submit(dto: SubmitContactDto, ipAddress?: string): Promise<boolean> {
    if (dto.website && dto.website.length > 0) {
      this.logger.warn(
        `Contact form honeypot tripped from ${ipAddress ?? 'unknown'}`,
      );
      return false;
    }

    // Persist before sending email so an outbound provider hiccup doesn't
    // lose the message. Stored rows surface in the admin inbox later.
    await this.prisma.contactSubmission.create({
      data: {
        name: dto.name,
        email: dto.email,
        message: dto.message,
        ipAddress: ipAddress ?? null,
      },
    });

    const inbox =
      this.config.get<string>('CONTACT_INBOX') ??
      this.config.get<string>('EMAIL_FROM') ??
      'hello@vital30.local';

    await this.email.send({
      to: inbox,
      subject: `[Vital30 contact] ${dto.name}`,
      text: [
        `From: ${dto.name} <${dto.email}>`,
        ipAddress ? `IP:   ${ipAddress}` : null,
        '',
        '---',
        '',
        dto.message,
        '',
        '---',
        'Sent via the challenge.charangudla.com contact form.',
      ]
        .filter((line) => line !== null)
        .join('\n'),
    });

    this.logger.log(`Contact submission queued from ${dto.email}`);
    return true;
  }
}
