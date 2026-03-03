import { Module } from '@nestjs/common';
import { EnrollmentRequestsController } from './enrollment-requests.controller';
import { EnrollmentRequestsService } from './enrollment-requests.service';

@Module({
  controllers: [EnrollmentRequestsController],
  providers: [EnrollmentRequestsService],
  exports: [EnrollmentRequestsService],
})
export class EnrollmentRequestsModule {}
