import { Module } from '@nestjs/common';
import { ClassesController } from './classes.controller';
import { ScheduleController } from './schedule.controller';
import { ClassesService } from './classes.service';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [MailModule],
  controllers: [ClassesController, ScheduleController],
  providers: [ClassesService],
  exports: [ClassesService],
})
export class ClassesModule {}
