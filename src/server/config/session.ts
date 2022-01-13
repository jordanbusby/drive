import type { SessionOptions } from 'express-session';

const THIRTY_MINUTES = 1000 * 60 * 30;

export const {
    SESSION_NAME,
    SESSION_SECRET,
    SESSION_IDLE_TIMEOUT = THIRTY_MINUTES * 4, //TWO HOURS
} = process.env;

export const SESSION_OPTIONS: SessionOptions = {
    name: SESSION_NAME,
    resave: false,
    saveUninitialized: false,
    secret: SESSION_SECRET as string,
    rolling: true,
    cookie: {
        maxAge: +SESSION_IDLE_TIMEOUT,
        sameSite: 'none', // 'strict'
        secure: true
    },
}