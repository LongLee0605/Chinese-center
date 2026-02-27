import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CoursesService } from './courses.service';
import { RolesGuard } from '../../core/guards/roles.guard';

@Controller('courses')
export class CoursesController {
  constructor(private courses: CoursesService) {}

  @Get()
  getList(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.courses.findAll({
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      status,
    });
  }

  @Get('by-slug/:slug')
  getBySlug(@Param('slug') slug: string) {
    return this.courses.findBySlug(slug);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.courses.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  create(@Body() body: any) {
    return this.courses.create(body);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  update(@Param('id') id: string, @Body() body: any) {
    return this.courses.update(id, body);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  remove(@Param('id') id: string) {
    return this.courses.remove(id);
  }
}
