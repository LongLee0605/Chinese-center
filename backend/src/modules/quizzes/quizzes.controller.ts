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
import { QuizzesService } from './quizzes.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';
import { RolesGuard } from '../../core/guards/roles.guard';

@Controller('quizzes')
export class QuizzesController {
  constructor(private quizzes: QuizzesService) {}

  // ----- Public (website) -----
  @Get('published')
  listPublished(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.quizzes.findPublished({
      page: Number(page) || 1,
      limit: Number(limit) || 50,
    });
  }

  @Get('by-slug/:slug')
  getBySlug(@Param('slug') slug: string) {
    return this.quizzes.findBySlug(slug);
  }

  @Post(':id/attempt')
  submitAttempt(@Param('id') id: string, @Body() dto: SubmitAttemptDto) {
    return this.quizzes.submitAttempt(id, dto.answers, {
      guestName: dto.guestName,
      guestEmail: dto.guestEmail,
    });
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.quizzes.findOne(id, false);
  }

  // ----- CRM -----
  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('courseId') courseId?: string,
    @Query('lessonId') lessonId?: string,
  ) {
    return this.quizzes.findAll({
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      courseId,
      lessonId,
    });
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  create(@Body() dto: CreateQuizDto) {
    return this.quizzes.create(dto);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  update(@Param('id') id: string, @Body() dto: UpdateQuizDto) {
    return this.quizzes.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  remove(@Param('id') id: string) {
    return this.quizzes.remove(id);
  }

  @Get(':id/questions')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  getQuestions(@Param('id') id: string) {
    return this.quizzes.findOne(id, true);
  }

  @Post(':id/questions')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  addQuestion(@Param('id') id: string, @Body() dto: CreateQuestionDto) {
    return this.quizzes.addQuestion(id, dto);
  }

  @Put('questions/:questionId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  updateQuestion(@Param('questionId') questionId: string, @Body() dto: Partial<CreateQuestionDto>) {
    return this.quizzes.updateQuestion(questionId, dto);
  }

  @Delete('questions/:questionId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  removeQuestion(@Param('questionId') questionId: string) {
    return this.quizzes.removeQuestion(questionId);
  }

  @Get(':quizId/attempts')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  listAttempts(
    @Param('quizId') quizId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.quizzes.listAttempts(quizId, {
      page: Number(page) || 1,
      limit: Number(limit) || 50,
    });
  }

  @Get('attempt/:attemptId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  getAttempt(@Param('attemptId') attemptId: string) {
    return this.quizzes.getAttempt(attemptId);
  }

  @Put('attempt/:attemptId/score')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  updateAttemptScore(
    @Param('attemptId') attemptId: string,
    @Body() body: { score: number },
  ) {
    return this.quizzes.updateAttemptScore(attemptId, body.score);
  }

  @Delete('attempt/:attemptId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  deleteAttempt(@Param('attemptId') attemptId: string) {
    return this.quizzes.deleteAttempt(attemptId);
  }
}
