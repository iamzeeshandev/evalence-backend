import { join } from 'path';

export const staticAssetsConfig = {
  rootPath: join(__dirname, '..', '..', 'uploads'),
  serveRoot: '/uploads',
};
