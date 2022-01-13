/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-shadow */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-multi-assign */
/* eslint-disable no-plusplus */
import fs from 'fs'
import crypto from 'crypto'
import { Request, Response } from 'express'
import { performance } from 'perf_hooks'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'

import writeHiddenPdf from '../lib/writeHiddenPdf'

import {
  FileStorage, InitRequest, UploadHandlerInterface, InitResponse
} from '../server.types'

const fileStorage: FileStorage = {}
const {
  DRIVE_PATH,
  PDF_PATH
} = process.env

class UploadHandler implements UploadHandlerInterface {
    public name: string

    public size: number

    public numChunks: number

    public chunks: Buffer[] = []

    public chunksDone = 0

    public currentDir: string

    public dir: string | null = null

    public absolutePath = ''

    public start: number

    constructor({
      name, size, numChunks, currentDir, dir
    }: InitRequest) {
      this.name = name
      this.size = size
      this.numChunks = numChunks
      this.currentDir = currentDir

      if (dir) {
        this.absolutePath = `${DRIVE_PATH + currentDir}/${dir}/${name}`
      } else {
        this.absolutePath = `${DRIVE_PATH + currentDir}/${name}`
      }
      this.start = performance.now()
    }

    complete(): boolean {
      return this.chunksDone === this.numChunks
    }

    async fetchPDF(): Promise<AxiosResponse['data']> {
      const file = this.concat()
      const options: AxiosRequestConfig = {
        method: 'POST',
        responseType: 'arraybuffer'
      }
      const response = await axios.post('https://convert.agristoreast.com:3010/convert', file, options)
      console.log(response.data.length)
      console.log(typeof response.data)
      return response.data
    }

    concat(): Buffer {
      return Buffer.concat(this.chunks)
    }

    pushChunk(index: number, parts: Buffer[], contentLength: number) {
      const chunk = Buffer.concat(parts)

      if (chunk.length !== contentLength) {
        console.log(`chunk: ${chunk.length}, content: ${contentLength}`)
        return false
      }

      this.chunks[index] = chunk
      this.chunksDone++

      return true
    }

    getChunkLength(chunkIndex: number): number {
      if (!this.chunks[chunkIndex]) {
        return 0
      }
      return this.chunks[chunkIndex].length
    }
}

export function uploadInit(request: Request, response: Response): boolean {
  if (!request.body || !request.body.name || request.body.size === undefined
    || request.body.numChunks === undefined || request.body.numChunks === null) {
    response.status(200).json({
      error: true,
      id: '',
      message: '!request.body'
    })
    return false
  }

  const id = crypto.randomBytes(64).toString('hex')
  const storage = fileStorage[id] = new UploadHandler(request.body)

  const initResp: InitResponse = { error: false, id, message: '' }

  if (request.body.dir) {
    const dir = `${DRIVE_PATH + request.body.currentDir}/${request.body.dir}`

    try {
      fs.mkdirSync(dir, { recursive: true })
    } catch (e) {
      response.status(200).json({
        error: true,
        id,
        message: `mkdir error: ${e}`
      })
      return false
    }
  }

  console.log(`receiving ${storage.name}: ${Math.round(((storage.size / 1024)))}KB`)
  response.status(200).json(initResp)
  return true
}

export function uploadHandler(request: Request, response: Response): void {
  const id = request.headers['x-file-id'] as string
  const chunk = Number(request.headers['x-chunk'])
  const length = Number(request.headers['content-length'])
  const storage = fileStorage[id]
  const parts: Buffer[] = []

  request.on('data', (part: Buffer) => {
    parts.push(part)
  })

  request.on('end', async () => {
    console.log(1)
    const done = storage.pushChunk(chunk, parts, length)

    if (!done) {
      response.status(200).json({
        error: true,
        message: 'Invalid chunk length',
        chunk
      })
      return
    }

    response.status(200).json({
      error: false,
      message: `Successfully received chunk ${chunk}`,
      chunk
    })

    // if we have received the proper number of bytes and chunks
    if (storage.complete()) {
      // write the file to disk
      fs.writeFileSync(storage.absolutePath, storage.concat())

      // get the converted pdf from the convert service and write hidden pdf to disk
      await writeHiddenPdf(storage.absolutePath)

      // const stream = fs.createWriteStream(storage.absolutePath)
      // stream.write(storage.concat())
      // stream.end()

      // log how long it took (can be removed in production)
      console.log(`${storage.name} took ${Math.floor(performance.now() - storage.start)}ms`)

      // delete the chunks from the storage instance, freeing memory
      for (let i = 0; i < storage.chunks.length; i++) {
        try {
          delete storage.chunks[i]
        } catch (e) {
          console.log(e)
        }
      }
    }
  })
}
