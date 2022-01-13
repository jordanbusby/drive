/* eslint-disable no-unused-expressions */
/* eslint-disable no-shadow */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import * as libre from 'libreoffice-convert';

const { DRIVE_PATH = '/drive', TMP_DIR = '/drive/tmp' } = process.env;

const router = Router();

interface ViewTypeInterface {
    [filetype: string]: boolean;
}

const VIEW_TYPES: ViewTypeInterface = {
  pdf: true,
  xls: true,
  xlsx: true,
  doc: true,
  docx: true,
  png: false,
  jpeg: false,
  jpg: false
};
/**
 * __Router for document preview__
 * We only need to preview one file at a time.
 * Goal: Only 1 costly server request from the front end.
 * That 1 request should get a file in response.
 * @todo security, file permissions, user permissions
 */
router.get('/preview', async (req, res) => {
  res.setHeader('cache-control', 'no-store')
  const { currentDir, name } = req.query

  if (!(currentDir && name) || typeof name !== 'string' || typeof currentDir !== 'string') {
    res.status(404).json({ message: 'File not found.' })
    return;
  }

  const type = name.split('.').pop()?.toLowerCase();

  // What types can we preview?
  if (!(type && Object.prototype.hasOwnProperty.call(VIEW_TYPES, type)
  && VIEW_TYPES[type] === true)) {
    res.json({ error: true, message: `Unable to view type: ${type}` })
    return
  }

  const filepath = path.join(DRIVE_PATH, currentDir, name)
  const filepathPDF = path.join(TMP_DIR, name.split('.').slice(0, -1).concat(['pdf']).join('.'))

  if (type === 'pdf') {
    // the file is already a pdf, no conversion needed, just send the desired URL
    res.status(200).sendFile(filepath, (e) => {
      if (e) console.log(e)
    })
    return
  }

  if (type === 'doc' || type === 'docx') {
    try {
      fs.readFileSync(filepathPDF)
    } catch (e) {
      const file = await fs.promises.readFile(filepath);
      libre.convert(file, '.pdf', undefined, async (err: any, data: Buffer) => {
        if (err) {
          console.log(err)
          return
        }
        await fs.promises.writeFile(filepathPDF, data);

        res.sendFile(filepathPDF, (err:any) => {
          console.log(err)
        })
      })
    }

    res.sendFile(filepathPDF, (err) => {
      console.log(res.getHeaders())
      if (err) console.log(err)
    })
    return
  }

  if (type === 'xls' || type === 'xlsx') {
    res.download(filepath, (err) => {
      if (err) {
        console.log(err);
      }
    })
  }
})

function promisifyConvert(file: Buffer): Promise<undefined|Buffer> {
  return new Promise((resolve, reject) => {
    libre.convert(file, '.pdf', undefined, (err: any, data: Buffer) => {
      if (err) reject
      resolve(data)
    })
  })
}

async function convertToPDF(docpath: string, pdfpath: string): Promise<boolean> {
  const file = await fs.promises.readFile(docpath)

  let buffer
  try {
    buffer = await promisifyConvert(file)
  } catch (e) {
    console.log(3)
    return false
  }

  if (buffer) {
    try {
      await fs.promises.writeFile(pdfpath, buffer)
    } catch (e) {
      console.log(e)
      return false
    }
    return true
  }
  console.log(2)
  return false
}

router.post('/previewdata', async (req, res) => {
  const { currentDir, filename } = req.body
  const type = filename.split('.').pop()!
  const absolutepath = `${DRIVE_PATH + currentDir}/${filename}`
  if (type === 'pdf') {
    res.sendFile(absolutepath, (e) => {
      if (e) console.log(e)
    })
  }

  if (type === 'doc' || type === 'docx') {
    const pdfpath = `${TMP_DIR}/${filename}`
    const convert = await convertToPDF(absolutepath, pdfpath)
    if (convert) {
      res.sendFile(pdfpath)
    } else {
      res.status(400).json({ message: 'failed to convert to pdf' })
    }
  }
})

router.post('/docbuffer', async (req, res) => {
  const { filepath } = req.body
  let data: Buffer
  const absolutePath = `${DRIVE_PATH}/${filepath}`
  try {
    data = await fs.promises.readFile(absolutePath)
  } catch (e) {
    res.json({ message: `Couldn't read file: ${filepath}`, error: e })
    return
  }
  res.send(data)
})

export default router;
