import { Module } from '@nestjs/common';
import { TrialRegistrationsController } from './trial-registrations.controller';
import { TrialRegistrationsService } from './trial-registrations.service';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [MailModule],
  controllers: [TrialRegistrationsController],
  providers: [TrialRegistrationsService],
  exports: [TrialRegistrationsService],
})
export class TrialRegistrationsModule {}
