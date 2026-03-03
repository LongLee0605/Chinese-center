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
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { RolesGuard } from '../../core/guards/roles.guard';
import { OptionalJwtAuthGuard } from '../../core/guards/optional-jwt.guard';

@Controller('lessons')
export class LessonsController {
  constructor(private lessons: LessonsService) {}

  @Get('course/:courseId')
  @UseGuards(OptionalJwtAuthGuard)
  getByCourse(
    @Request() req: { user?: { role?: string } },
    @Param('courseId') courseId: string,
    @Query('published') published?: string,
  ) {
    const role = req.user?.role ?? null;
    return this.lessons.findByCourse(courseId, published === 'true', role);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  getOne(
    @Request() req: { user?: { role?: string } },
    @Param('id') id: string,
  ) {
    const role = req.user?.role ?? null;
    return this.lessons.findOne(id, role);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  create(@Body() dto: CreateLessonDto) {
    return this.lessons.create(dto);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  update(
    @Request() req: { user: { role: string } },
    @Param('id') id: string,
    @Body() dto: UpdateLessonDto,
  ) {
    return this.lessons.update(id, dto, req.user.role);
  }

  @Put('course/:courseId/reorder')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  reorder(@Param('courseId') courseId: string, @Body() body: { orderedIds: string[] }) {
    return this.lessons.reorder(courseId, body.orderedIds);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  remove(@Request() req: { user: { role: string } }, @Param('id') id: string) {
    return this.lessons.remove(id, req.user.role);
  }
}
