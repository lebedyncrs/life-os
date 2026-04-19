/**
 * NLU output consumed by Telegram routers and domain use cases.
 * Intents are a closed set; the LLM adapter MUST map provider output into these shapes.
 */

/** Discriminator values for {@link ParsedCommand}. */
export type NluIntentKind = ParsedCommand['intent'];

/**
 * Single shopping line as understood from user text (trimmed, non-empty).
 * Normalization (case-fold, dedupe) happens in the shopping use case, not in NLU.
 */
export type ShoppingItemDraft = string;

/** Owner asked to replace the whole list in the same utterance (explicit phrase). */
export type AddShoppingPayload = {
  items: ShoppingItemDraft[];
  /** When true, persistence layer should clear existing open items before adding (US1). */
  replaceAll: boolean;
};

/** Idea body from explicit save-idea utterances (trimmed in use case / repository). */
export type SaveIdeaPayload = {
  body: string;
  /** Optional short label (e.g. first line); persistence may omit if empty. */
  title?: string | null;
};

/** Next birthday celebration + reminder metadata from NLU (US3). */
export type SetBirthdayReminderPayload = {
  personName: string;
  /** Next calendar date when the birthday is observed (YYYY-MM-DD). */
  nextOccurrenceOn: string;
  originalYearKnown: boolean;
  leadDays: number;
  notes?: string | null;
};

/** Parsed NLU command: exactly one variant. */
export type ParsedCommand =
  | {
      intent: 'ADD_SHOPPING';
      payload: AddShoppingPayload;
    }
  | {
      intent: 'SAVE_IDEA';
      payload: SaveIdeaPayload;
    }
  | {
      intent: 'SET_BIRTHDAY_REMINDER';
      payload: SetBirthdayReminderPayload;
    }
  | {
      intent: 'UNKNOWN';
      /** Optional machine-safe hint for logging or UX (no PII). */
      reason?: 'empty' | 'unintelligible' | 'no_shopping_intent' | 'ambiguous' | 'other';
    };

/** True when the command is safe to act on for shopping persistence. */
export function isAddShopping(cmd: ParsedCommand): cmd is Extract<ParsedCommand, { intent: 'ADD_SHOPPING' }> {
  return cmd.intent === 'ADD_SHOPPING';
}

/** True when the command is safe to act on for idea persistence (US2). */
export function isSaveIdea(cmd: ParsedCommand): cmd is Extract<ParsedCommand, { intent: 'SAVE_IDEA' }> {
  return cmd.intent === 'SAVE_IDEA';
}

/** True when the command is safe to act on for birthday persistence (US3). */
export function isSetBirthdayReminder(
  cmd: ParsedCommand,
): cmd is Extract<ParsedCommand, { intent: 'SET_BIRTHDAY_REMINDER' }> {
  return cmd.intent === 'SET_BIRTHDAY_REMINDER';
}
