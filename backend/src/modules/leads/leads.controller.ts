import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards, InternalServerErrorException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { RolesGuard } from '../../core/guards/roles.guard';

@Controller('leads')
export class LeadsController {
  constructor(private leads: LeadsService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: 'TU_VAN' | 'DANG_KY_HOC_THU',
  ) {
    return this.leads.findAll({
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      type,
    });
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  getOne(@Param('id') id: string) {
    return this.leads.findOne(id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  remove(@Param('id') id: string) {
    return this.leads.remove(id);
  }

  @Post()
  async create(@Body() dto: CreateLeadDto) {
    try {
      return await this.leads.create(dto);
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('does not exist') || msg.includes('Unknown table') || msg.includes('relation') || msg.includes('leads')) {
        throw new InternalServerErrorException(
          'Database chưa sẵn sàng. Vui lòng chạy: cd backend && npm run db:push',
        );
      }
      throw err;
    }
  }
}
