export type EmailPayload = {
  to: string;
  subject: string;
  /** Plain-text body. Required. */
  text: string;
  /** Optional HTML body. Most transactional emails work fine with text only. */
  html?: string;
};

export interface EmailProvider {
  send(payload: EmailPayload): Promise<void>;
}
