export abstract class TrainingRepository {
  abstract countSessionsBetween(ownerId: string, startInclusive: Date, endInclusive: Date): Promise<number>;

  abstract logSession(ownerId: string, occurredOn: Date, label: string): Promise<void>;
}
