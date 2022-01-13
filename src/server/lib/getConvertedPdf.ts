/* eslint-disable consistent-return */
import fs from 'fs'
import axios from 'axios'

/**
 * If we don't have the pdf file stored already, we need
 * to call out to a windows server to use Word to convert
 * the doc to a pdf.
 * @param docAbsolutePath string location to doc[x] file
 */
async function getConvertedPdf(docAbsolutePath: string): Promise<Buffer| undefined> {
  // load doc file into buffer/memory
  const docBuffer = fs.readFileSync(docAbsolutePath)

  // send https post with pdf buffer
  console.log('sending post requeset to convert...')
  const response = await axios.post('https://convert.agristoreast.com:3010/convert', docBuffer, {
    headers: {
      'Content-Type': 'application/octet-stream'
    },
    responseType: 'arraybuffer'
  })

  if (response.status !== 200) {
    console.log(`
    Error in getting converted PDF Data:
    ${response.statusText}
    `)
    return
  }

  // Get a Buffer instance (ArrayBufferView, or 'byte array view') from the raw ArrayBuffer
  const pdfBuffer = Buffer.from(response.data)

  // return the Buffer instance
  return pdfBuffer
}

export default getConvertedPdf
