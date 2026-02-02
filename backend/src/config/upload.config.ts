import { registerAs } from '@nestjs/config';

export default registerAs('upload', () => ({
  maxFileSize: parseInt(
    process.env.UPLOAD_MAX_FILE_SIZE || String(5 * 1024 * 1024),
    10,
  ),
  excelMaxRows: parseInt(process.env.EXCEL_MAX_ROWS || '1000', 10),
}));
