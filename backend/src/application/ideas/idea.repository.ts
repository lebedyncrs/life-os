import type { IdeaSource } from '@prisma/client';

export type NewIdea = {
  body: string;
  title?: string | null;
  source: IdeaSource;
};

export abstract class IdeaRepository {
  abstract create(ownerId: string, idea: NewIdea): Promise<{ id: string }>;
}
