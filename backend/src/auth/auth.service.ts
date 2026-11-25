import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const password = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = await this.prisma.user.create({
      data: { name: dto.name, email: dto.email, password },
    });

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const matches = await bcrypt.compare(dto.password, user.password);
    if (!matches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.buildAuthResponse(user);
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Session is no longer valid');
    }
    return this.toPublicUser(user);
  }

  private buildAuthResponse(user: { id: string; name: string; email: string; password: string }) {
    const payload = { sub: user.id, email: user.email, name: user.name };
    return {
      accessToken: this.jwt.sign(payload),
      user: this.toPublicUser(user),
    };
  }

  private toPublicUser(user: { id: string; name: string; email: string; password?: string }) {
    return { id: user.id, name: user.name, email: user.email };
  }
}
