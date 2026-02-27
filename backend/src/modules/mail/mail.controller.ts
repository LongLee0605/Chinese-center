import { Body, Controller, Post, Get, Delete, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsString, IsOptional, IsArray, IsEmail } from 'class-validator';
import { Transform } from 'class-transformer';
import { MailService, SendMailOptions } from './mail.service';
import { RolesGuard } from '../../core/guards/roles.guard';

class SendMailDto {
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value.map((v: unknown) => String(v).trim()).filter(Boolean);
    if (typeof value === 'string') return value.split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean);
    return [];
  })
  @IsArray()
  @IsEmail({}, { each: true })
  to!: string[];

  @IsString()
  subject!: string;

  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsString()
  html?: string;
}

@Controller('mail')
export class MailController {
  constructor(private mail: MailService) {}

  @Post('send')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async send(@Body() dto: SendMailDto) {
    const toList = dto.to?.filter(Boolean) ?? [];
    if (!toList.length) return { success: false, error: 'Thiếu địa chỉ người nhận (to)' };
    const opts: SendMailOptions = {
      to: toList,
      subject: dto.subject,
      text: dto.text,
      html: dto.html,
    };
    return this.mail.send(opts);
  }

  @Get('sent')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  listSent(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.mail.listSent({
      page: Number(page) || 1,
      limit: Number(limit) || 50,
    });
  }

  @Get('sent/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  getSent(@Param('id') id: string) {
    return this.mail.getSent(id);
  }

  @Delete('sent/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  deleteSent(@Param('id') id: string) {
    return this.mail.deleteSent(id);
  }

  @Post('check')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  check() {
    return { configured: this.mail.isConfigured() };
  }
}
