import { IsString, MaxLength } from 'class-validator';

export class ToggleReactionDto {
  /**
   * Reaction code from REACTION_EMOJI catalog. Server validates so
   * arbitrary emoji can't be persisted. POST is idempotent + toggling:
   * second call with the same emoji removes the user's existing
   * reaction.
   */
  @IsString()
  @MaxLength(32)
  emoji!: string;
}
