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
import { QuizzesService } from './quizzes.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';
import { RolesGuard } from '../../core/guards/roles.guard';
import { OptionalJwtAuthGuard } from '../../core/guards/optional-jwt.guard';

@Controller('quizzes')
export class QuizzesController {
  constructor(private quizzes: QuizzesService) {}

  // ----- Public (website) -----
  @Get('published')
  @UseGuards(OptionalJwtAuthGuard)
  listPublished(
    @Request() req: { user?: { role?: string } },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const role = req.user?.role ?? null;
    return this.quizzes.findPublished(
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
    return this.quizzes.findBySlug(slug, role);
  }

  @Get(':id/my-attempts')
  @UseGuards(OptionalJwtAuthGuard)
  getMyAttempts(
    @Request() req: { user?: { sub?: string } },
    @Param('id') id: string,
  ) {
    return this.quizzes.getMyAttemptsSummary(id, req.user?.sub ?? null);
  }

  @Post(':id/attempt')
  @UseGuards(OptionalJwtAuthGuard)
  submitAttempt(
    @Request() req: { user?: { sub?: string; role?: string } },
    @Param('id') id: string,
    @Body() dto: SubmitAttemptDto,
  ) {
    const role = req.user?.role ?? null;
    return this.quizzes.submitAttempt(id, dto.answers, {
      userId: req.user?.sub ?? undefined,
      guestName: dto.guestName,
      guestEmail: dto.guestEmail,
      userRole: role,
    });
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  getOne(
    @Request() req: { user?: { role?: string } },
    @Param('id') id: string,
  ) {
    const role = req.user?.role ?? null;
    return this.quizzes.findOne(id, false, role);
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
  update(
    @Request() req: { user: { role: string } },
    @Param('id') id: string,
    @Body() dto: UpdateQuizDto,
  ) {
    return this.quizzes.update(id, dto, req.user.role);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  remove(@Request() req: { user: { role: string } }, @Param('id') id: string) {
    return this.quizzes.remove(id, req.user.role);
  }

  @Get(':id/questions')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  getQuestions(
    @Request() req: { user: { role: string } },
    @Param('id') id: string,
  ) {
    return this.quizzes.findOne(id, true, req.user.role);
  }

  @Post(':id/questions')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  addQuestion(
    @Request() req: { user: { role: string } },
    @Param('id') id: string,
    @Body() dto: CreateQuestionDto,
  ) {
    return this.quizzes.addQuestion(id, dto, req.user.role);
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
