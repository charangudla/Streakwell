import { IsString, MaxLength } from 'class-validator';

export class PostMessageDto {
  /**
   * Catalog code from chat-presets.ts. Server validates membership;
   * unknown codes return 400 so a stale client can't spam DB rows
   * with codes we don't render.
   */
  @IsString()
  @MaxLength(64)
  presetCode!: string;
}
