/* eslint-disable import/prefer-default-export */
/* eslint-disable no-restricted-syntax */
/* eslint-disable guard-for-in */
/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from 'fs/promises'
import path from 'path'
import { deleteHiddenFiles } from './hiddenTools'

const { DRIVE_PATH = '/drive' } = process.env

/**
 * So, because of the nature of dragging and dropping a folder
 * onto the page on any given folder, we have to construct the
 * path of a file from three parts:
 *  1. The DRIVE_PATH: /drive
 *  2. The current path that the user is in on the webapp: /filestore/Potandon/Misc
 *  3. The path of the dropped folder to the file ('/droppedFolder/lastweek/MyDocument.docx')
 * So, once we have the three parts of the path, we can get the absolute path to the file:
 * /drive/filestore/Potandon/Misc/droppedFolder/lastweek/MyDocument.docx
 */

export async function deleteSync(
  files: Record<string, {path: string, filename: string, action: string}>,
  directory: string
): Promise<any> {
  const deleteHiddenResult = await deleteHiddenFiles(files, directory)

  const promises = Object.keys(files).map((filename) => {
    const file = files[filename]
    const filePath = path.join(DRIVE_PATH, directory, file.path, file.filename)
    console.log(`filePath in 'normal' delete: ${filePath}`)
    return fs.rm(filePath)
      .then(() => ({
        message: 'deleted',
        error: false
      }))
      .catch((err) => ({
        message: 'error',
        error: err
      }))
  })

  const resultPromise = Promise.all(promises)
    .then(() => ({ message: 'deleted', error: false }))
    .catch((error) => ({ message: 'error', error }))

  return resultPromise
}
