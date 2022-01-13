import { dirname, basename, extname } from 'path'
import { stat, mkdir } from 'fs/promises'
import { Stats } from 'fs'

export interface PDFPathInfo {
  fileDirPath: string
  fileName: string
  hiddenDirpath: string
  hiddenFilepath: string
  hiddenDirPathStats?: Stats
  hiddenFileStats?: Stats
  createdHiddenDir: boolean
  createdPath?: string
  absoluteFilePath: string
  fileExtension: string
}

async function getPdfPathInfo(
  absoluteFilePath: string,
  createPath?: boolean
): Promise<PDFPathInfo> {
  let hiddenDirPathStats
  let createdHiddenDir = false
  let createdPath
  let hiddenFileStats

  // get all the filenames and paths
  const fileDirPath = dirname(absoluteFilePath)
  const fileName = basename(absoluteFilePath)
  const fileExtension = extname(absoluteFilePath)
  const pdfFileName = fileName.replace(fileExtension, '.pdf')
  const hiddenDirpath = `${fileDirPath}/hidden_pdf`
  const hiddenFilepath = `${hiddenDirpath}/${pdfFileName}`

  // check to see if hidden pdf path already exists
  try {
    hiddenDirPathStats = await stat(hiddenDirpath)
  // eslint-disable-next-line no-empty
  } catch (e) {}

  // if it does, check to see if hidden pdf already exists
  if (hiddenDirPathStats) {
    try {
      hiddenFileStats = await stat(hiddenFilepath)
    // eslint-disable-next-line no-empty
    } catch (e) {}
  }

  // create the hidden pdf path if function was invoked
  // with the 'true' second parameter and the path doesn't
  // already exist
  if (createPath && !hiddenDirPathStats) {
    try {
      createdPath = await mkdir(hiddenDirpath, { recursive: true })
      createdHiddenDir = true
    } catch (e) {
      console.log(e)
    }
  }

  const result = {
    fileDirPath,
    fileName,
    hiddenDirpath,
    hiddenFilepath,
    hiddenDirPathStats,
    hiddenFileStats,
    createdHiddenDir,
    createdPath,
    absoluteFilePath,
    fileExtension
  }

  return result
}

export default getPdfPathInfo
