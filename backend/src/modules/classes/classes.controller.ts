import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  BadRequestException,
  Header,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';

@Controller('classes')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.TEACHER)
export class ClassesController {
  constructor(private service: ClassesService) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  list(
    @Request() req: { user: { sub: string; role: string } },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: 'OPEN' | 'CLOSED',
  ) {
    return this.service.findAll(
      {
        page: Number(page) || 1,
        limit: Number(limit) || 50,
        status: status as 'OPEN' | 'CLOSED' | undefined,
      },
      req.user.sub,
      req.user.role as 'SUPER_ADMIN' | 'TEACHER',
    );
  }

  @Get(':id')
  getOne(
    @Request() req: { user: { sub: string; role: string } },
    @Param('id') id: string,
  ) {
    return this.service.findOne(id, req.user.sub, req.user.role as 'SUPER_ADMIN' | 'TEACHER');
  }

  @Post()
  create(
    @Request() req: { user: { sub: string; role: string } },
    @Body() dto: CreateClassDto,
  ) {
    return this.service.create(
      {
        name: dto.name,
        teacherId: dto.teacherId,
        scheduleDayOfWeek: dto.scheduleDayOfWeek,
        scheduleStartTime: dto.scheduleStartTime,
        scheduleEndTime: dto.scheduleEndTime,
        room: dto.room,
        maxMembers: dto.maxMembers,
      },
      req.user.sub,
      req.user.role as 'SUPER_ADMIN' | 'TEACHER',
    );
  }

  @Put(':id')
  update(
    @Request() req: { user: { sub: string; role: string } },
    @Param('id') id: string,
    @Body() dto: UpdateClassDto,
  ) {
    return this.service.update(
      id,
      {
        name: dto.name,
        teacherId: dto.teacherId,
        scheduleDayOfWeek: dto.scheduleDayOfWeek,
        scheduleStartTime: dto.scheduleStartTime,
        scheduleEndTime: dto.scheduleEndTime,
        room: dto.room,
        maxMembers: dto.maxMembers,
      },
      req.user.sub,
      req.user.role as 'SUPER_ADMIN' | 'TEACHER',
    );
  }

  @Post(':id/close')
  close(
    @Request() req: { user: { sub: string; role: string } },
    @Param('id') id: string,
  ) {
    return this.service.close(id, req.user.sub, req.user.role as 'SUPER_ADMIN' | 'TEACHER');
  }

  @Post(':id/members')
  addMember(
    @Request() req: { user: { sub: string; role: string } },
    @Param('id') id: string,
    @Body() body: { userId: string },
  ) {
    return this.service.addMember(
      id,
      body.userId,
      req.user.sub,
      req.user.role as 'SUPER_ADMIN' | 'TEACHER',
    );
  }

  @Delete(':id/members/:userId')
  removeMember(
    @Request() req: { user: { sub: string; role: string } },
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    return this.service.removeMember(
      id,
      userId,
      req.user.sub,
      req.user.role as 'SUPER_ADMIN' | 'TEACHER',
    );
  }

  /** CRM: duyệt đăng ký lớp (người chưa có tài khoản) → tạo user + thêm vào lớp + gửi mail */
  @Patch(':id/registration-requests/:requestId')
  reviewRegistrationRequest(
    @Request() req: { user: { sub: string; role: string } },
    @Param('id') id: string,
    @Param('requestId') requestId: string,
    @Body() body: { status: 'APPROVED' | 'REJECTED' },
  ) {
    if (!body?.status || !['APPROVED', 'REJECTED'].includes(body.status)) {
      throw new BadRequestException('status phải là APPROVED hoặc REJECTED');
    }
    if (body.status === 'APPROVED') {
      return this.service.approveRegistrationRequest(
        id,
        requestId,
        req.user.sub,
        req.user.role as 'SUPER_ADMIN' | 'TEACHER',
      );
    }
    return this.service.rejectRegistrationRequest(
      id,
      requestId,
      req.user.role as 'SUPER_ADMIN' | 'TEACHER',
    );
  }

  /** CRM: hoàn duyệt đơn đã duyệt — chuyển về chờ duyệt và bỏ học viên khỏi lớp. */
  @Post(':id/registration-requests/:requestId/revert')
  revertRegistrationRequest(
    @Request() req: { user: { sub: string; role: string } },
    @Param('id') id: string,
    @Param('requestId') requestId: string,
  ) {
    return this.service.revertRegistrationRequest(
      id,
      requestId,
      req.user.sub,
      req.user.role as 'SUPER_ADMIN' | 'TEACHER',
    );
  }

  /** CRM: xóa đơn đăng ký (nếu đã duyệt thì bỏ học viên khỏi lớp). */
  @Delete(':id/registration-requests/:requestId')
  deleteRegistrationRequest(
    @Request() req: { user: { sub: string; role: string } },
    @Param('id') id: string,
    @Param('requestId') requestId: string,
  ) {
    return this.service.deleteRegistrationRequest(
      id,
      requestId,
      req.user.role as 'SUPER_ADMIN' | 'TEACHER',
    );
  }

  @Delete(':id')
  remove(
    @Request() req: { user: { sub: string; role: string } },
    @Param('id') id: string,
  ) {
    return this.service.remove(id, req.user.sub, req.user.role as 'SUPER_ADMIN' | 'TEACHER');
  }
}
