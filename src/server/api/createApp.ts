/* eslint-disable import/prefer-default-export */
import express from 'express';
import session from 'express-session';
import morgan from 'morgan';
import { SESSION_OPTIONS } from '../config';
import { notFound, serverError } from '../middleware';
import {
  home, login, register, upload, api, download, preview, getpdf
} from '../routes';
import db from '../routes/db'

export function createApp(store: session.Store): express.Application {
  const app = express()
  app.set('trust proxy', 1)
  app.use(express.json({ limit: 200000 }), express.static('public', { lastModified: false }))
  app.use(session({
    ...SESSION_OPTIONS,
    store
  }))

  app.use('/api', api)
  app.use('/api', upload)
  app.use(download)
  app.use(db)
  app.use(preview)
  app.use(home)
  app.use(register)
  app.use(login)
  app.use(getpdf)
  app.use(notFound)
  app.use(serverError)
  return app
}
