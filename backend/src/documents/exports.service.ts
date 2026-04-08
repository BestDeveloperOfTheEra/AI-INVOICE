import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

@Injectable()
export class ExportsService {
  async generateExcel(data: any[]) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('GST Report');

    worksheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Invoice Number', key: 'invoiceNumber', width: 20 },
      { header: 'Vendor', key: 'vendor', width: 30 },
      { header: 'Vendor GSTIN', key: 'vendorGstin', width: 20 },
      { header: 'Customer Name', key: 'customerName', width: 30 },
      { header: 'Customer GSTIN', key: 'customerGstin', width: 20 },
      { header: 'Address', key: 'address', width: 40 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'CGST', key: 'cgst', width: 10 },
      { header: 'SGST', key: 'sgst', width: 10 },
      { header: 'IGST', key: 'igst', width: 10 },
      { header: 'Total Amount', key: 'totalAmount', width: 15 },
    ];

    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;
    let grandTotal = 0;

    data.forEach(item => {
      const extracted = JSON.parse(item.extractedData || '{}');
      const itemTotal = item.totalAmount ?? extracted.totalAmount ?? 0;
      const itemCGST = item.cgst ?? extracted.taxBreakdown?.cgst ?? 0;
      const itemSGST = item.sgst ?? extracted.taxBreakdown?.sgst ?? 0;
      const itemIGST = item.igst ?? extracted.taxBreakdown?.igst ?? 0;

      totalCGST += itemCGST;
      totalSGST += itemSGST;
      totalIGST += itemIGST;
      grandTotal += itemTotal;

      worksheet.addRow({
        date: item.processedAt ? item.processedAt.toLocaleDateString() : 'N/A',
        invoiceNumber: extracted.invoiceNumber || item.fileName,
        vendor: extracted.vendor || 'N/A',
        vendorGstin: extracted.vendorGstin || item.gstin || 'N/A',
        customerName: extracted.customerName || 'N/A',
        customerGstin: extracted.customerGstin || 'N/A',
        address: extracted.address || 'N/A',
        email: extracted.email || 'N/A',
        phone: extracted.phone || 'N/A',
        totalAmount: itemTotal,
        cgst: itemCGST,
        sgst: itemSGST,
        igst: itemIGST,
      });
    });

    // Add Summary Section
    worksheet.addRow([]); // Spacer
    const totalRow = worksheet.addRow({
      vendor: 'GRAND TOTALS',
      totalAmount: grandTotal,
      cgst: totalCGST,
      sgst: totalSGST,
      igst: totalIGST,
    });
    totalRow.font = { bold: true, size: 12 };
    totalRow.getCell('vendor').alignment = { horizontal: 'right' };

    const wordsRow = worksheet.addRow({
      vendor: `Amount in Words: ${this.numberToWords(Math.round(grandTotal))} Only`,
    });
    wordsRow.font = { italic: true, color: { argb: 'FF4F46E5' } }; // Indigo color
    worksheet.mergeCells(`C${wordsRow.number}:G${wordsRow.number}`);

    return workbook.xlsx.writeBuffer();
  }

  async generatePdf(data: any[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text('GST Invoice Extraction Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'right' });
      doc.moveDown();

      // Table Header
      const tableTop = 120;
      const colWidths = [60, 80, 120, 80, 120, 60, 60, 60, 80];
      const colPositions = [40, 110, 200, 330, 420, 550, 620, 690, 760];
      const headers = ['Date', 'Invoice #', 'Vendor', 'Vendor GST', 'Customer', 'CGST', 'SGST', 'IGST', 'Total'];

      doc.font('Helvetica-Bold').fontSize(10);
      headers.forEach((header, i) => {
        doc.text(header, colPositions[i] - 10, tableTop, { width: colWidths[i], align: 'left' });
      });

      doc.moveTo(30, tableTop + 15).lineTo(810, tableTop + 15).stroke();
      doc.font('Helvetica').fontSize(9);

      let currentY = tableTop + 25;
      let totalCGST = 0;
      let totalSGST = 0;
      let totalIGST = 0;
      let grandTotal = 0;

      data.forEach(item => {
        const extracted = JSON.parse(item.extractedData || '{}');
        const itemTotal = item.totalAmount ?? extracted.totalAmount ?? 0;
        const itemCGST = item.cgst ?? extracted.taxBreakdown?.cgst ?? 0;
        const itemSGST = item.sgst ?? extracted.taxBreakdown?.sgst ?? 0;
        const itemIGST = item.igst ?? extracted.taxBreakdown?.igst ?? 0;

        totalCGST += itemCGST;
        totalSGST += itemSGST;
        totalIGST += itemIGST;
        grandTotal += itemTotal;

        if (currentY > 500) {
          doc.addPage({ layout: 'landscape' });
          currentY = 50;
          doc.font('Helvetica-Bold').fontSize(10);
          headers.forEach((header, i) => {
            doc.text(header, colPositions[i] - 10, currentY, { width: colWidths[i], align: 'left' });
          });
          doc.moveTo(30, currentY + 15).lineTo(810, currentY + 15).stroke();
          currentY += 25;
          doc.font('Helvetica').fontSize(9);
        }

        doc.text(item.processedAt ? item.processedAt.toLocaleDateString() : 'N/A', colPositions[0] - 10, currentY, { width: colWidths[0] });
        doc.text(extracted.invoiceNumber || item.fileName, colPositions[1] - 10, currentY, { width: colWidths[1] });
        doc.text(extracted.vendor || 'N/A', colPositions[2] - 10, currentY, { width: colWidths[2] });
        doc.text(extracted.vendorGstin || item.gstin || 'N/A', colPositions[3] - 10, currentY, { width: colWidths[3] });
        doc.text(extracted.customerName || 'N/A', colPositions[4] - 10, currentY, { width: colWidths[4] });
        doc.text(itemCGST.toFixed(2), colPositions[5] - 10, currentY, { width: colWidths[5] });
        doc.text(itemSGST.toFixed(2), colPositions[6] - 10, currentY, { width: colWidths[6] });
        doc.text(itemIGST.toFixed(2), colPositions[7] - 10, currentY, { width: colWidths[7] });
        doc.text(itemTotal.toFixed(2), colPositions[8] - 10, currentY, { width: colWidths[8] });

        currentY += 20;
      });

      // Summary Row
      if (currentY > 550) {
        doc.addPage({ layout: 'landscape' });
        currentY = 50;
      }
      doc.moveTo(30, currentY).lineTo(810, currentY).stroke();
      currentY += 10;
      doc.font('Helvetica-Bold').fontSize(11);
      doc.text('GRAND TOTALS', colPositions[4] - 10, currentY, { width: colWidths[4], align: 'right' });
      doc.text(totalCGST.toFixed(2), colPositions[5] - 10, currentY, { width: colWidths[5] });
      doc.text(totalSGST.toFixed(2), colPositions[6] - 10, currentY, { width: colWidths[6] });
      doc.text(totalIGST.toFixed(2), colPositions[7] - 10, currentY, { width: colWidths[7] });
      doc.text(grandTotal.toFixed(2), colPositions[8] - 10, currentY, { width: colWidths[8] });

      currentY += 25;
      doc.font('Helvetica-Oblique').fontSize(10).fillColor('#4F46E5');
      doc.text(`Amount in Words: ${this.numberToWords(Math.round(grandTotal))} Only`, colPositions[0] - 10, currentY);

      doc.end();
    });
  }

  private numberToWords(num: number): string {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const n = ('000000000' + num).substr(-9);
    if (num === 0) return 'Zero';
    
    let str = '';
    str += Number(n.substr(0, 2)) != 0 ? (a[Number(n.substr(0, 2))] || b[Number(n[0])] + ' ' + a[Number(n[1])]) + 'Crore ' : '';
    str += Number(n.substr(2, 2)) != 0 ? (a[Number(n.substr(2, 2))] || b[Number(n[2])] + ' ' + a[Number(n[3])]) + 'Lakh ' : '';
    str += Number(n.substr(4, 2)) != 0 ? (a[Number(n.substr(4, 2))] || b[Number(n[4])] + ' ' + a[Number(n[5])]) + 'Thousand ' : '';
    str += Number(n.substr(6, 1)) != 0 ? (a[Number(n.substr(6, 1))] || b[Number(n[6])] + ' ' + a[Number(n[7])]) + 'Hundred ' : '';
    str += Number(n.substr(7, 2)) != 0 ? (str != '' ? 'and ' : '') + (a[Number(n.substr(7, 2))] || b[Number(n[7])] + ' ' + a[Number(n[8])]) + 'Rupees ' : 'Rupees ';
    return str.trim();
  }

  async generateTallyXml(data: any[]) {
    // Basic Tally XML format (simplified)
    let xml = '<?xml version="1.0"?>\n<ENVELOPE>\n  <HEADER>\n    <TALLYREQUEST>Import Data</TALLYREQUEST>\n  </HEADER>\n  <BODY>\n    <IMPORTDATA>\n      <REQUESTDESC>\n        <REPORTNAME>Vouchers</REPORTNAME>\n      </REQUESTDESC>\n      <REQUESTDATA>\n';
    
    data.forEach(item => {
      const extracted = JSON.parse(item.extractedData || '{}');
      const itemTotal = item.totalAmount ?? extracted.totalAmount ?? 0;
      xml += `        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Purchase" ACTION="Create">
            <DATE>${item.processedAt ? item.processedAt.toISOString().split('T')[0].replace(/-/g, '') : ''}</DATE>
            <VOUCHERNUMBER>${item.fileName}</VOUCHERNUMBER>
            <PARTYLEDGERNAME>${extracted.vendor || 'Generic Vendor'}</PARTYLEDGERNAME>
            <AMOUNT>${itemTotal}</AMOUNT>
            <GSTIN>${item.gstin || ''}</GSTIN>
          </VOUCHER>
        </TALLYMESSAGE>\n`;
    });

    xml += '      </REQUESTDATA>\n    </IMPORTDATA>\n  </BODY>\n</ENVELOPE>';
    return Buffer.from(xml, 'utf-8');
  }
}
