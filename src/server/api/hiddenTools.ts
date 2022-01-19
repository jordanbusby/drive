/* eslint-disable no-await-in-loop */
import axios from 'axios'
import { rm } from 'fs/promises'
import {
  basename, dirname, resolve, extname, join
} from 'path'

import writeHiddenPdf from '../lib/writeHiddenPdf'

const { DRIVE_PATH = '/drive' } = process.env

interface FileDataSet {
  action: string
  filename: string
  path: string
}

/**
 *
 * @param files The list of files chosen from the sync form to be deleted
 * @param directory string of the current directory
 *
 * The hidden PDF file should always be the current folder
 * + '/hidden_pdf/' + the file name with a '.pdf' extension
 * instead of '.doc' or '.docx'
 * currentFileDirectory/hidden_pdf/filename.pdf
 */

function getHiddenPath(file: string, dir: string) {
  // extract just the filename and remove the extension
  const filenameWithoutExt = basename(file, extname(file))

  const filenameWithExt = `${filenameWithoutExt}.pdf`
  const fullPath = join(DRIVE_PATH, dir, filenameWithExt)

  return fullPath
}

export async function deleteHiddenFiles(
  files: Record<string, FileDataSet>, directory: string
): Promise<Record<string, unknown>[]> {
  const docFiles = Object.keys(files).filter((filename) => extname(filename).includes('doc'))
  const rmPromises = docFiles.map((file) => {
    const { path, filename } = files[file]
    const filePath = join(path, filename)
    const fullPath = getHiddenPath(filePath, directory)

    return rm(fullPath)
      .then(() => ({
        path,
        result: 'success',
        error: undefined
      }))
      .catch((error) => ({
        path,
        result: 'error',
        error
      }))
  })
  return Promise.all(rmPromises)
}

// we want to await writeHiddenPdf each loop because we don't
// want to overload windows server/convert service
// we may even want to do a sleep(2000) or something
export async function createHiddenFiles(docPaths: string[]): Promise<void> {
  for (const docPath of docPaths) {
    console.log(`getting ${basename(docPath)}`)
    await writeHiddenPdf(docPath)
  }
}
