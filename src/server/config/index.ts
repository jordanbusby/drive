export * from './cache';
export * from './session';
export * from './db';
export * from './auth';

const {
    BASE_DIR,
    DRIVE_PATH,
    PORT,
    READ_ENV = false
} = process.env;

export const APP_CONFIG = { BASE_DIR, DRIVE_PATH, PORT, READ_ENV };