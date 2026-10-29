import { config as loadEnv } from 'dotenv';
import path from 'node:path';
import { createAppDataSource } from './create-data-source';

loadEnv({ path: path.resolve(__dirname, '../../../../.env') });

export default createAppDataSource();
