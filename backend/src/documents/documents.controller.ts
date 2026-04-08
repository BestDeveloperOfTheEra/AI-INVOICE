import { Controller, Post, Get, UseInterceptors, UploadedFiles, UseGuards, Req, Res, Param, BadRequestException } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CombinedAuthGuard } from '../auth/combined-auth.guard';
import { DocumentsService } from './documents.service';
import { ExportsService } from './exports.service';
import { StorageService } from './storage.service';

@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly exportsService: ExportsService,
    private readonly storageService: StorageService
  ) {}

  @Get()
  @UseGuards(CombinedAuthGuard)
  async getDocuments(@Req() req: any) {
    return this.documentsService.getDocumentsByUser(req.user.id);
  }

  @Post('upload')
  @UseGuards(CombinedAuthGuard)
  @UseInterceptors(FilesInterceptor('files', 50, { dest: './uploads' }))
  async uploadFiles(@UploadedFiles() files: Express.Multer.File[], @Req() req: any) {
    if (!files || files.length === 0) throw new Error("No files uploaded");
    const userId = req.user.id;
    const isSandbox = req.headers['x-sandbox'] === 'true';
    
    // Process all files. For real production, this should be a queue/background job.
    const results = [];
    for (const file of files) {
      try {
        const result = await this.documentsService.processDocument(userId, file, isSandbox);
        results.push(result);
      } catch (error) {
        // Individual file error - Log it but don't crash the whole batch if possible
        // For now, if one fails we still want to know what happened
        console.error(`Error processing file ${file.originalname}:`, error);
        results.push({
          fileName: file.originalname,
          status: 'failed',
          errorMessage: error.message || 'Internal processing error'
        });
      }
    }
    return results;
  }

  @Get('export/excel')
  @UseGuards(CombinedAuthGuard)
  async exportExcel(@Req() req: any, @Res() res: any) {
    const documents = await this.documentsService.getDocumentsByUser(req.user.id);
    const buffer = await this.exportsService.generateExcel(documents);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="GST_Report.xlsx"',
    });
    res.send(buffer);
  }

  @Get('export/tally')
  @UseGuards(CombinedAuthGuard)
  async exportTally(@Req() req: any, @Res() res: any) {
    const documents = await this.documentsService.getDocumentsByUser(req.user.id);
    const buffer = await this.exportsService.generateTallyXml(documents);
    res.set({
      'Content-Type': 'application/xml',
      'Content-Disposition': 'attachment; filename="Tally_Import.xml"',
    });
    res.send(buffer);
  }

  @Get('export/pdf')
  @UseGuards(CombinedAuthGuard)
  async exportPdf(@Req() req: any, @Res() res: any) {
    const documents = await this.documentsService.getDocumentsByUser(req.user.id);
    const buffer = await this.exportsService.generatePdf(documents);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="GST_Report.pdf"',
    });
    res.send(buffer);
  }

  @Get('download/:id')
  @UseGuards(CombinedAuthGuard)
  async downloadDocument(@Param('id') id: string, @Req() req: any, @Res() res: any) {
    const document = await this.documentsService.getDocumentById(id, req.user.id);
    if (!document) throw new BadRequestException("Document not found");
    
    // 1. If file is in R2/S3, generate a fresh signed URL and redirect
    if (document.fileKey) {
      try {
        const signedUrl = await this.storageService.generatePresignedUrl(document.fileKey);
        return res.redirect(signedUrl);
      } catch (error) {
        console.error("Error generating signed URL for download:", error);
        throw new BadRequestException("Failed to generate download link.");
      }
    }

    // 2. Fallback to local file system (Legacy/Sandbox)
    const fs = require('fs');
    if (!fs.existsSync(document.fileUrl)) {
      throw new BadRequestException("Original file no longer exists on server");
    }

    res.download(document.fileUrl, document.fileName);
  }
}
