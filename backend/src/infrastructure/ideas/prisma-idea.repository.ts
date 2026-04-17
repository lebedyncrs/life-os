import { Injectable } from '@nestjs/common';
import { IdeaRepository, type NewIdea } from '../../application/ideas/idea.repository';
import { PrismaService } from '../prisma/prisma.service';

const MAX_BODY = 10_000;
const MAX_TITLE = 200;

@Injectable()
export class PrismaIdeaRepository extends IdeaRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(ownerId: string, idea: NewIdea): Promise<{ id: string }> {
    const body = idea.body.trim().slice(0, MAX_BODY);
    const rawTitle = idea.title?.trim();
    const title = rawTitle && rawTitle.length > 0 ? rawTitle.slice(0, MAX_TITLE) : null;
    const row = await this.prisma.idea.create({
      data: {
        ownerId,
        body,
        title,
        source: idea.source,
      },
    });
    return { id: row.id };
  }
}
