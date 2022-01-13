import fs from 'fs/promises'
import getConvertedPdf from './getConvertedPdf'
import getPdfPathInfo from './getPdfInfo'

async function writeHiddenPdf(docAbsolutePath: string): Promise<void> {
  // get all pathing info for file path
  // check to see if hidden pdf dir exists, and create it if not
  const { hiddenFilepath } = await getPdfPathInfo(docAbsolutePath, true)

  // get the ArrayBuffer of the PDF from the convert service (convert.agristoreast.com)
  const pdfArrayBuffer = await getConvertedPdf(docAbsolutePath) as ArrayBuffer

  // create a Buffer from the ArrayBuffer, and write it to the hidden pdf path
  fs.writeFile(hiddenFilepath, Buffer.from(pdfArrayBuffer))
}

export default writeHiddenPdf
