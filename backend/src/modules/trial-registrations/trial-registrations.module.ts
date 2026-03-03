import { Module } from '@nestjs/common';
import { TrialRegistrationsController } from './trial-registrations.controller';
import { TrialRegistrationsService } from './trial-registrations.service';

@Module({
  controllers: [TrialRegistrationsController],
  providers: [TrialRegistrationsService],
  exports: [TrialRegistrationsService],
})
export class TrialRegistrationsModule {}
