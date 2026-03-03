import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './core/prisma/prisma.module';
import { HealthController } from './health.controller';
import { AuthModule } from './modules/auth/auth.module';
import { PostsModule } from './modules/posts/posts.module';
import { CoursesModule } from './modules/courses/courses.module';
import { LessonsModule } from './modules/lessons/lessons.module';
import { QuizzesModule } from './modules/quizzes/quizzes.module';
import { MailModule } from './modules/mail/mail.module';
import { LeadsModule } from './modules/leads/leads.module';
import { TeachersModule } from './modules/teachers/teachers.module';
import { UsersModule } from './modules/users/users.module';
import { EnrollmentRequestsModule } from './modules/enrollment-requests/enrollment-requests.module';
import { TrialRegistrationsModule } from './modules/trial-registrations/trial-registrations.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SearchModule } from './modules/search/search.module';

@Module({
  controllers: [HealthController],
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    PostsModule,
    CoursesModule,
    LessonsModule,
    QuizzesModule,
    MailModule,
    LeadsModule,
    TeachersModule,
    UsersModule,
    EnrollmentRequestsModule,
    TrialRegistrationsModule,
    NotificationsModule,
    SearchModule,
  ],
})
export class AppModule {}
