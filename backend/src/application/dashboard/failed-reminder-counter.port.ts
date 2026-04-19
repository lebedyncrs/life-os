export abstract class FailedReminderCounterPort {
  abstract countFailedForOwner(ownerId: string): Promise<number>;
}
