import { Injectable } from '@nestjs/common';
import type { Idea } from '@prisma/client';
import { IdeaRepository, type NewIdea } from '../../application/ideas/idea.repository';
import { PrismaService } from '../prisma/prisma.service';

const MAX_BODY = 10_000;
const MAX_TITLE = 200;

@Injectable()
export class PrismaIdeaRepository extends IdeaRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(ownerId: string, idea: NewIdea): Promise<Idea> {
    const body = idea.body.trim().slice(0, MAX_BODY);
    const rawTitle = idea.title?.trim();
    const title = rawTitle && rawTitle.length > 0 ? rawTitle.slice(0, MAX_TITLE) : null;
    return this.prisma.idea.create({
      data: {
        ownerId,
        body,
        title,
        source: idea.source,
      },
    });
  }

  async listByOwner(ownerId: string): Promise<Idea[]> {
    return this.prisma.idea.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteByIdForOwner(ownerId: string, id: string): Promise<boolean> {
    const row = await this.prisma.idea.findFirst({ where: { id, ownerId } });
    if (!row) {
      return false;
    }
    await this.prisma.idea.delete({ where: { id } });
    return true;
  }
}
