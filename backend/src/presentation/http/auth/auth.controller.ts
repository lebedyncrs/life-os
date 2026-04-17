import { Body, Controller, Get, HttpCode, Post, Req, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @HttpCode(204)
  async login(@Body() dto: LoginDto, @Req() req: Request): Promise<void> {
    const owner = await this.auth.validateCredentials(dto.email, dto.password);
    await new Promise<void>((resolve, reject) => {
      req.session.regenerate((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
    req.session.ownerId = owner.id;
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@Req() req: Request): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      req.session.destroy((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}

@Controller()
export class MeController {
  constructor(private readonly auth: AuthService) {}

  @Get('me')
  async me(@Req() req: Request) {
    const ownerId = req.session.ownerId;
    if (!ownerId) {
      throw new UnauthorizedException();
    }
    const owner = await this.auth.getOwnerById(ownerId);
    return {
      id: owner.id,
      email: owner.email,
      timezone: owner.timezone,
      telegram_linked: owner.telegramChatId !== null,
    };
  }
}
