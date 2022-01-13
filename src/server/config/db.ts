import { ConnectOptions } from 'mongoose';

const {
    MONGO_USER,
    MONGO_PASS,
    MONGO_HOST,
    MONGO_PORT,
    MONGO_DB
} = process.env;

export const MONGO_URI = `mongodb://${MONGO_USER}:${encodeURIComponent(MONGO_PASS as string)}@${MONGO_HOST}:${MONGO_PORT}`;

export const MONGO_CONNECT_OPTIONS: ConnectOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    authSource: 'admin',
    dbName: MONGO_DB
}