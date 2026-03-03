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
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CoursesService } from './courses.service';
import { RolesGuard } from '../../core/guards/roles.guard';
import { OptionalJwtAuthGuard } from '../../core/guards/optional-jwt.guard';

@Controller('courses')
export class CoursesController {
  constructor(private courses: CoursesService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
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

  /** Website: danh sách khóa học theo quyền (guest hoặc role). */
  @Get('public')
  @UseGuards(OptionalJwtAuthGuard)
  getPublicList(
    @Request() req: { user?: { role?: string } },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const role = req.user?.role ?? null;
    return this.courses.findForPublic(
      { page: Number(page) || 1, limit: Number(limit) || 50 },
      role,
    );
  }

  @Get('by-slug/:slug')
  @UseGuards(OptionalJwtAuthGuard)
  getBySlug(
    @Request() req: { user?: { role?: string } },
    @Param('slug') slug: string,
  ) {
    const role = req.user?.role ?? null;
    return this.courses.findBySlug(slug, role);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  getOne(
    @Request() req: { user?: { role?: string } },
    @Param('id') id: string,
  ) {
    const role = req.user?.role ?? null;
    return this.courses.findOne(id, role);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  create(@Body() body: any) {
    return this.courses.create(body);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  update(
    @Request() req: { user: { role: string } },
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.courses.update(id, body, req.user.role);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  remove(@Request() req: { user: { role: string } }, @Param('id') id: string) {
    return this.courses.remove(id, req.user.role);
  }
}
