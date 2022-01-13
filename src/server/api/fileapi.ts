/* eslint-disable no-continue */
/* eslint-disable no-await-in-loop */
import fs from 'fs/promises'
import path from 'path'
import util from 'util'
import type { Stats } from 'fs'

const { DRIVE_PATH = '/drive' } = process.env

// DRIVE_PATH = /drive +
// directory = current directory on drive, = /filestore/CompanyFolder/{folder1, folder2, file1} +
// file.webkitRelativePath = /{subFolder1}/myFile.docx

type WebKitFile = File & {
    webkitRelativePath: string;
}

interface Compare {
    stats: Stats
    defaultAction: 'add' | 'overwrite' | 'ignore'
    existing: boolean
    newer?: boolean
}

type FileInformation = Pick<WebKitFile, 'lastModified' | 'name' | 'webkitRelativePath' | 'size'> & Compare

interface FileTree {
    [index: string]: FileInformation | FileTree
}

interface IFile {
    lastModified: number
    name: string
    webkitRelativePath: string
    size: number
    defaultAction: 'add' | 'overwrite' | 'ignore'
    existing: boolean
    newer?: boolean
    stats?: Stats
}

async function* fileStats(files: FileInformation[], dir: string): AsyncGenerator<FileInformation> {
  let i = 0
  while (i < files.length) {
    const absolutePath = path.join(DRIVE_PATH, dir, files[i].webkitRelativePath)
    const file = files[i]
    const statsObject = await fs.stat(absolutePath)
      .then((stats) => {
        const newer = stats.mtimeMs < file.lastModified
        const defaultAction = newer ? 'overwrite' : 'ignore'
        const result = {
          existing: true, stats, newer, defaultAction
        }

        for (const [key, val] of Object.entries(result)) {
          Object.defineProperty(file, key, {
            value: val,
            writable: true,
            enumerable: true,
            configurable: true
          })
        }

        return file
      })
      .catch(() => {
        const result = { existing: false, defaultAction: 'add' }
        for (const [key, val] of Object.entries(result)) {
          Object.defineProperty(file, key, {
            value: val,
            writable: true,
            enumerable: true,
            configurable: true
          })
        }
        return file
      })

    yield file
    i++
  }
}

async function getFileDirectoryObject(
  filelist: FileInformation[],
  directory: string
): Promise<FileTree> {
  const has = Object.prototype.hasOwnProperty
  const folderMap: FileTree = {}
  for await (const file of fileStats(filelist, directory)) {
    const folders = file.webkitRelativePath.slice(1).split('/')

    // is a file
    if (folders.length < 2) {
      folderMap[file.name] = file
      continue
    }

    // is a folder
    folders.pop()
    let filepath = folderMap
    for (let i = 0; i < folders.length; i++) {
      const lastFolder = i === folders.length - 1

      if (!has.call(filepath, folders[i])) {
        filepath[folders[i]] = {}
      }

      filepath = filepath[folders[i]] as FileTree

      if (lastFolder) {
        Object.defineProperty(filepath, file.name, {
          value: file,
          writable: true,
          enumerable: true,
          configurable: true
        })
      }
    }
  }
  return folderMap
}

// eslint-disable-next-line import/prefer-default-export
export async function compareFiles(files: FileInformation[], directory: string): Promise<FileTree> {
  const fileMap = await getFileDirectoryObject(files, directory)
  return fileMap
}
