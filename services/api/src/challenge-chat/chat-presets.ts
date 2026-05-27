/**
 * The closed set of messages a user can post in a challenge chat.
 *
 * Open free-text chat invites moderation work + bad-faith posts that
 * derail the focus of a challenge community. Constraining users to a
 * curated catalog keeps signal high, avoids the moderation queue
 * entirely, and nudges everyone toward shared accountability moments
 * ("done today", "missed today, back tomorrow") rather than venting.
 *
 * Codes are server-validated on POST so a client can't sneak in a code
 * we don't recognise. Text + tone are sent down on GET so the client
 * doesn't need to know about every preset to render them — adding a
 * new preset only requires touching this file.
 *
 * Tones drive the colour treatment in the message bubble:
 *   success     bright brand-green pill
 *   milestone   gold accent for the showpiece moments
 *   support     soft rose — recovery without judgement
 *   neutral     slate — no opinion
 *   humor       amber — playful
 *   encourage   sky — group hype
 */

export type ChatPresetTone =
  | 'success'
  | 'milestone'
  | 'support'
  | 'neutral'
  | 'humor'
  | 'encourage';

export interface ChatPreset {
  code: string;
  text: string;
  tone: ChatPresetTone;
}

export const CHAT_PRESETS: ChatPreset[] = [
  { code: 'DONE_TODAY', text: "I'm done today ✅", tone: 'success' },
  { code: 'BURNED_IT', text: 'On fire today 🔥🔥', tone: 'success' },
  {
    code: 'COMPLETED_CHALLENGE',
    text: 'Just completed the whole challenge! 🎉',
    tone: 'milestone',
  },
  {
    code: 'WEEK_MILESTONE',
    text: 'One week strong 💪',
    tone: 'milestone',
  },
  {
    code: 'MISSED_TODAY',
    text: 'Missed today — back tomorrow stronger 💪',
    tone: 'support',
  },
  {
    code: 'SKIPPED_TODAY',
    text: 'Skipping today, no judgement',
    tone: 'neutral',
  },
  { code: 'CHEAT_DAY', text: 'Had a cheat today 😅', tone: 'humor' },
  {
    code: 'COMING_BACK',
    text: 'Restarting fresh 🌱',
    tone: 'support',
  },
  {
    code: 'GRATEFUL',
    text: 'Grateful for this community 🙏',
    tone: 'milestone',
  },
  {
    code: 'KEEP_GOING',
    text: "Let's go everyone! 🙌",
    tone: 'encourage',
  },
  {
    code: 'HALFWAY',
    text: 'Halfway there ⚡️',
    tone: 'milestone',
  },
  {
    code: 'NEED_MOTIVATION',
    text: 'Need a push today — could use the energy',
    tone: 'support',
  },
];

const PRESET_CODES = new Set(CHAT_PRESETS.map((p) => p.code));

export function isValidPresetCode(code: string): boolean {
  return PRESET_CODES.has(code);
}

/**
 * Reaction emoji catalog. Stored as short ASCII codes in DB so we can
 * swap the displayed character without a migration. Codes are short +
 * lowercase to keep the wire format small.
 */
export interface ChatReactionEmoji {
  code: string;
  /** Emoji character the client renders. */
  char: string;
  /** A11y label for screen readers. */
  label: string;
}

export const REACTION_EMOJI: ChatReactionEmoji[] = [
  { code: 'fire', char: '🔥', label: 'fire' },
  { code: 'love', char: '❤️', label: 'love' },
  { code: 'celebrate', char: '🎉', label: 'celebrate' },
  { code: 'muscle', char: '💪', label: 'strong' },
  { code: 'clap', char: '👏', label: 'applause' },
  { code: 'praying', char: '🙏', label: 'thanks' },
];

const REACTION_CODES = new Set(REACTION_EMOJI.map((r) => r.code));

export function isValidEmojiCode(code: string): boolean {
  return REACTION_CODES.has(code);
}
