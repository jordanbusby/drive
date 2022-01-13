/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable semi-style */
import express from 'express'
import session from 'express-session'
import http from 'http'
import Redis from 'ioredis'
import connectRedis from 'connect-redis'
import mongoose from 'mongoose'
import {
  REDIS_OPTIONS, APP_CONFIG, MONGO_URI, MONGO_CONNECT_OPTIONS
} from './config'
import { createApp } from './api/createApp'

const { PORT } = APP_CONFIG

const RedisStore = connectRedis(session)
const client = new Redis(REDIS_OPTIONS)
const store = new RedisStore({ client })
const app: express.Application = createApp(store)

;(async function startDrive() {
  try {
    await mongoose.connect(MONGO_URI, MONGO_CONNECT_OPTIONS)
  } catch (e:any) {
    console.error(e.stack)
  }

  http.createServer(app).listen(PORT)
}())
