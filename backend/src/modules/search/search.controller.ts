import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SearchService } from './search.service';
import { RolesGuard } from '../../core/guards/roles.guard';

@Controller('search')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  search(
    @Request() req: { user: { sub: string; role: string } },
    @Query('q') q?: string,
    @Query('limit') limit?: string,
  ) {
    return this.searchService.search(q ?? '', {
      limit: limit ? Number(limit) : undefined,
      requesterId: req.user.sub,
      requesterRole: req.user.role as 'SUPER_ADMIN' | 'TEACHER',
    });
  }
}
