import { Controller, Get, Put, Post, Body, UseGuards, Req, UseInterceptors, UploadedFile, Param, Res, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import type { Response } from 'express';
import { existsSync } from 'fs';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async getMe(@Req() req: any) {
    // AuthGuard already attaches the user, but we'll fetch via service to ensure we get fresh DB state (name, avatar, etc.)
    const user = await this.usersService.findOne(req.user.email);
    if (!user) throw new NotFoundException('User not found');
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  @UseGuards(AuthGuard('jwt'))
  @Put('profile')
  async updateProfile(@Req() req: any, @Body() body: { name: string }) {
    return this.usersService.updateProfile(req.user.id, { name: body.name });
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('avatar')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req: any, file, cb) => {
        // req.user is populated by AuthGuard because interceptors run after guards
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        cb(null, `avatar-${req.user?.id || 'unknown'}-${uniqueSuffix}${ext}`);
      }
    }),
    fileFilter: (req, file, cb) => {
      // Accept only images
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
        return cb(new Error('Only image files are allowed!'), false);
      }
      cb(null, true);
    }
  }))
  async uploadAvatar(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
    if (!file) throw new Error("No file uploaded");
    return this.usersService.updateAvatar(req.user.id, file.filename);
  }

  // Serve the avatar images publicly (no guard needed, or can be added if desired)
  @Get('avatar/:filename')
  serveAvatar(@Param('filename') filename: string, @Res() res: Response) {
    const avatarPath = join(process.cwd(), 'uploads', filename);
    if (!existsSync(avatarPath)) {
        // Optional fallback image or 404
        throw new NotFoundException('Avatar not found');
    }
    return res.sendFile(avatarPath);
  }
}
