import { Body, Controller, Delete, Get, HttpCode, NotFoundException, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { IdeaSource } from '@prisma/client';
import { IdeaRepository } from '../../../application/ideas/idea.repository';
import { CurrentOwnerId } from '../auth/current-owner.decorator';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { CreateIdeaDto } from './dto/create-idea.dto';

function toIdeaJson(row: { id: string; title: string | null; body: string; createdAt: Date }) {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    created_at: row.createdAt.toISOString(),
  };
}

@Controller('ideas')
@UseGuards(SessionAuthGuard)
export class IdeasController {
  constructor(private readonly ideas: IdeaRepository) {}

  @Get()
  async list(@CurrentOwnerId() ownerId: string) {
    const rows = await this.ideas.listByOwner(ownerId);
    return rows.map(toIdeaJson);
  }

  @Post()
  @HttpCode(201)
  async create(@CurrentOwnerId() ownerId: string, @Body() dto: CreateIdeaDto) {
    const row = await this.ideas.create(ownerId, {
      body: dto.body,
      title: dto.title ?? null,
      source: IdeaSource.dashboard,
    });
    return toIdeaJson(row);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@CurrentOwnerId() ownerId: string, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    const ok = await this.ideas.deleteByIdForOwner(ownerId, id);
    if (!ok) {
      throw new NotFoundException();
    }
  }
}
