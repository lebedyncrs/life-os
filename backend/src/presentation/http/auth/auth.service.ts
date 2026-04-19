import { Injectable, UnauthorizedException } from '@nestjs/common';
import { compareSync } from 'bcryptjs';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async validateCredentials(email: string, password: string) {
    const owner = await this.prisma.owner.findUnique({ where: { email } });
    if (!owner || !compareSync(password, owner.passwordHash)) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return owner;
  }

  async getOwnerById(id: string) {
    return this.prisma.owner.findUniqueOrThrow({ where: { id } });
  }
}
