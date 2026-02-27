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
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { RolesGuard } from '../../core/guards/roles.guard';

@Controller('lessons')
export class LessonsController {
  constructor(private lessons: LessonsService) {}

  @Get('course/:courseId')
  getByCourse(
    @Param('courseId') courseId: string,
    @Query('published') published?: string,
  ) {
    return this.lessons.findByCourse(courseId, published === 'true');
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.lessons.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  create(@Body() dto: CreateLessonDto) {
    return this.lessons.create(dto);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  update(@Param('id') id: string, @Body() dto: UpdateLessonDto) {
    return this.lessons.update(id, dto);
  }

  @Put('course/:courseId/reorder')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  reorder(@Param('courseId') courseId: string, @Body() body: { orderedIds: string[] }) {
    return this.lessons.reorder(courseId, body.orderedIds);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  remove(@Param('id') id: string) {
    return this.lessons.remove(id);
  }
}
