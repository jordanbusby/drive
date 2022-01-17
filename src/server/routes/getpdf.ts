import { Router, json } from 'express'
import fs from 'fs'
import { extname } from 'path'

import getPdfPathInfo from '../lib/getPdfInfo'
import getConvertedPdf from '../lib/getConvertedPdf'

/**
 * @todo
 * This returns abruptly, without a response, if an error
 * occurs along the way. Need to respond with an error
 * so the client-side knows what's up.
 */

// unused for now, but probably a good idea to implement it
const { DRIVE_PATH } = process.env

// create the express router
const router = Router()

// parse json payloads to POJO and put it in req.body
router.use(json())

router.post('/getpdf', async (req, res) => {
  res.setHeader('Cache-Control', 'No-store')
  const { absoluteFilePath } = req.body
  const drivePath = `${DRIVE_PATH}${absoluteFilePath}`
  const extension = extname(absoluteFilePath).toLowerCase()

  // if its a pdf, send the file
  if (extension === '.pdf') {
    console.log('its a pdf, sending...')
    res.sendFile(drivePath, (err) => {
      if (err) {
        console.log(err)
      }
    })
    return
  }

  // its a DOC[X]

  // see if hidden pdf exists already or not, and
  // create the hidden pdf directory if the directory doesnt exist either
  const { hiddenFilepath, hiddenFileStats } = await getPdfPathInfo(drivePath, true)

  // if hidden pdf exists, send file
  if (hiddenFileStats) {
    res.sendFile(hiddenFilepath, (e) => {
      if (e) {
        console.log(`Error sending hidden PDF File: ${e}`)
      }
    })
    return
  }

  // if hidden pdf doesnt exist, fetch the converted data
  const pdfBuffer = await getConvertedPdf(drivePath)

  // getConvertedPdf will return 'undefined' if unsuccessful, so we
  // exit early if we didn't get the right information
  if (!pdfBuffer) {
    console.log('Unable to get converted PDF Buffer from getConvertedPdf() (call to convert service failed for some reason.')
    return
  }

  // write hidden pdf to disk, then sendFile
  fs.writeFile(hiddenFilepath, pdfBuffer, (err) => {
    if (err) {
      console.log(err)
      return
    }
    // eslint-disable-next-line no-shadow
    res.sendFile(hiddenFilepath, (err) => {
      if (err) {
        console.log(err)
      }
    })
  })
})

export default router
