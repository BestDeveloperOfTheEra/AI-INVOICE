import { Controller, Get, Post, Delete, Body, Req, UseGuards, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTokensService } from './api-tokens.service';

@Controller('api-tokens')
@UseGuards(AuthGuard('jwt'))
export class ApiTokensController {
  constructor(private readonly apiTokensService: ApiTokensService) {}

  @Get()
  async getMyTokens(@Req() req: any) {
    return this.apiTokensService.listTokens(req.user.id);
  }

  @Post()
  async createToken(@Req() req: any, @Body('name') name: string) {
    return this.apiTokensService.generateToken(req.user.id, name || 'Default Token');
  }

  @Delete(':id')
  async revokeToken(@Req() req: any, @Param('id') id: string) {
    return this.apiTokensService.revokeToken(req.user.id, id);
  }
}
