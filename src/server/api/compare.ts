/* eslint-disable no-await-in-loop */
import type { Stats } from 'fs'
import fs from 'fs/promises'
import path from 'path'

type DroppedFile = Pick<File, 'lastModified' | 'name' | 'size' | 'type'> & {
    webkitRelativePath: string
}

type ComparedFile = DroppedFile & {
    action: 'add' | 'delete' | 'overwrite' | 'ignore'
    stats?: Stats
}

interface FileStructure {
    [index: string]: DroppedFile | FileStructure | ComparedFile
}

const {
  DRIVE_PATH = '/drive'
} = process.env

/**
 * @param droppedFiles
 * A flat array of all the files dropped in the browser.
 * @param dir
 * The directory that the user dropped the files in on the browser.
 * @summary
 * The challenge:
 * We are comparing file structures.
 * On one side, we have the dropped FileSystemEntry objects from
 * the browser. On the other side, we have a linux file structure,
 * being read with node.
 *
 * The strategy:
 * I am going to try to build an object for each structure, with the keys
 * of the object the folder names, or the file names.
 *
 * The details:
 * Once both objects are constructed, I will step through each object, comparing
 * each directory, defining properties on each file. Once a final object is created,
 * it should have an action for every file that's on the server currently, either:
 *
 ** Delete: Exists on Drive, but not on the dragged items.
 ** Add: Exists on Drive, but is a dragged item.
 ** Ignore: Exists in both, and the dragged file is older/same age.
 ** Overwrite: Exists in both, dragged file is newer.
 *
 *** Note: We only want to sync one level below the top dragged folder.
 * It could have unintended consequences if you synced the top-level folder.
 * Users would most likely be intending to sync the dragged folder, not sync
 * the folder they are dragging into! They are trying to sync the folders/files that
 * they drag!
 *
 */

export async function compare(
  droppedFiles: Array<DroppedFile>,
  dir: string
): Promise<FileStructure> {
  const has = Object.prototype.hasOwnProperty
  const folderMap: FileStructure = {}
  const existingFilesMap: Map<string, string[]> = new Map()

  // loop through every dropped file
  for (const file of droppedFiles) {
    const folderPath = `${path.dirname(file.webkitRelativePath)}/`

    // if the existing-files map doesn't have an entry for this file location
    if (!existingFilesMap.has(folderPath)) {
      const absolutePath = path.join(DRIVE_PATH, dir, folderPath)
      // get all entries in folder that current file is in
      const existingFiles = await fs.readdir(absolutePath, { withFileTypes: true })

        // only want the files
        .then((entryArray) => entryArray.filter((entry) => entry.isFile()).map((f) => f.name))

        // if error, return blank array
        .catch(() => [])

      // set the files under the foldername in the map
      existingFilesMap.set(folderPath, existingFiles)
    }

    // if the existing files map already has this current folder set, and there are files in it
    if (existingFilesMap.get(folderPath)?.length) {
      // get an array of the current file's folder's files, with the current file removed
      const existingFilesArray = existingFilesMap.get(folderPath)?.filter(
        (name) => name !== file.name
      )

      // update the existing files map without the current file
      existingFilesMap.set(folderPath, existingFilesArray as Array<string>)
    }

    // get an array of the folders of the webkitRelativePath
    const folders = file.webkitRelativePath.slice(1).split('/')

    // top level file (dragged file)
    if (folders.length === 1) {
      const absolutePath = path.resolve(DRIVE_PATH, dir.slice(1), folders[0])

      // set the filename as a property on top level of folderMap of the file, action, and stats
      folderMap[file.name] = await fs.stat(absolutePath)

        // file exists, if we have older version, action = 'overwrite'. else 'ignore'
        .then((stats) => {
          const propertyMap: PropertyDescriptorMap = {
            stats: {
              writable: true, enumerable: true, configurable: true, value: stats
            },
            action: {
              writable: true, enumerable: true, configurable: true, value: stats.mtimeMs >= file.lastModified ? 'ignore' : 'overwrite'
            }
          }
          Object.defineProperties(file, propertyMap)
          return file as ComparedFile
        })

        // dropped file doesn't exist on the drive, so action = 'add'
        .catch(() => {
          Object.defineProperty(file, 'action', {
            writable: true, enumerable: true, configurable: true, value: 'add'
          })
          return file as ComparedFile
        })
      // eslint-disable-next-line no-continue
      continue
    }

    // it's a folder, so lets start at the top of our folder map
    let currentPath = folderMap

    for (const folder of folders) {
      // the last thing in the folders array is the file name
      // e.g.: /EG95/Notes/test1.pdf, [ 'EG95', 'Notes', 'test1.pdf' ]
      const isFile = folder === folders.slice(-1)[0]

      // if we don't already have a property for this folder/file
      // in the folder map, set it to an object
      if (!has.call(currentPath, folder) && !isFile) {
        currentPath[folder] = {}
      }

      if (isFile) {
        /**
         * Decide The Action
         *
         * If the file exists on Drive already, then it is one of 3 actions:
         * Ignore: The file on drive is newer/same age as dropped file.
         * Overwrite: The file on drive is older age as dropped file.
         * Delete: The file is on drive and not in dropped files -- THAT IS DECIDED LATER
         *
         * If the file does not exist on Drive, then it is an Add action.
         */

        const absolutePath = path.join(DRIVE_PATH, dir, file.webkitRelativePath)

        currentPath[file.name] = await fs.stat(absolutePath)
          .then((stats) => {
            // ignore or overwrite actions are decided here
            const propertyMap: PropertyDescriptorMap = {
              stats: {
                writable: true, enumerable: true, configurable: true, value: stats
              },
              action: {
                writable: true, enumerable: true, configurable: true, value: stats.mtimeMs >= file.lastModified ? 'ignore' : 'overwrite'
              }
            }

            Object.defineProperties(file, propertyMap)
            return file as ComparedFile
          })
          .catch(() => {
            // doesn't exist, so add is the action here, and no stats available
            Object.defineProperty(file, 'action', {
              writable: true, enumerable: true, configurable: true, value: 'add'
            })
            return file as ComparedFile
          })

        // if there isnt any dropped files (!some)
        // with the current file's path (dfile.path === file.path)
        // && that has not been iterated yet (!has.call(currentPath, dfile.name))

        // aka, if this is the last file out of the ones in the dropped folder

        // We can use this to see if we have added all dropped files in the current folder
        // And to start the check to see what files exist on Drive that were not dropped
        // These files will have the 'delete' action
        // Doing it now is nice, because we already have
        // a reference to the currentPath of the File Structure Object
        // If we did it outside this loop, we would have to index
        // our way back into the proper level again, which isn't impossible.

        /**
         * Delete Action
         *
         * First, we check if we have iterated through all
         * the dropped files in the current folder (!files.some).
         * If so, we begin looking at what files are in this folder on Drive,
         * that haven't been dropped -- We do this by comparing the
         * currentPath object's keys to the filenames
         * on the Drive. (in existingFilesMap object)
         *
         * For each file on Drive that wasn't dragged,
         * we get a Stats object with fs.stat(), and set the file in the currentPath object
         * with the same information as a ComparedFile object.
         *
         * See the comment block above this one
         * for notes on the !droppedFiles.some() predicate function.
         */

        const currentFolderFiles = droppedFiles.filter(
          (f) => `${path.dirname(f.webkitRelativePath)}/` === folderPath
        )

        // a better way of what I was trying to say with !some(file => !has.call(...))
        // !files.some(f => !f...) is the same as files.every(f => f...)
        // just easier to understand

        // "if every dropped file in the current folder has a property on the currentPath object"
        const checkedAllFilesInCurrentFolder = currentFolderFiles.every(
          // eslint-disable-next-line no-shadow, no-loop-func
          ({ name }) => has.call(currentPath, name)
        )

        if (checkedAllFilesInCurrentFolder) {
          // existing files map now only contains files that were not dropped
          const existingFilesList = existingFilesMap.get(folderPath) || []

          for (const filename of existingFilesList) {
            const existingAbsolutePath = path.join(DRIVE_PATH, dir, folderPath)
            currentPath[filename] = await fs.stat(existingAbsolutePath)
              // mark for deletion
              .then((stats) => {
                const existingFile = {
                  name: filename, size: stats.size, lastModified: stats.mtimeMs, type: filename.split('.').pop(), webkitRelativePath: folderPath
                }
                Object.defineProperties(existingFile, {
                  stats: {
                    value: stats, enumerable: true, configurable: true, writable: true
                  },
                  action: {
                    value: 'delete', enumerable: true, configurable: true, writable: true
                  }
                })
                return existingFile as ComparedFile
              })
          }
        }
      }

      // Done with current folder or file.
      // index into the next folde property in the
      // file structure, and update the current path reference.
      // note: this will be undefined if it was a file (because )
      currentPath = currentPath[folder] as FileStructure
    }
  }
  return folderMap
}

export async function deleteSync(
  files: { [filename: string]: { path: string } },
  directory: string
): Promise<{ message: string, error: boolean }> {
  return Promise.all(
    Object.keys(files)
      .map((filename) => {
        const file = files[filename]
        const absolutePath = path.resolve(DRIVE_PATH, directory.slice(1), file.path.slice(1))
        return fs.rm(absolutePath)
      })
  )
    .then(() => ({ message: 'deleted', error: false }), (error) => ({ message: 'error', error }))
}
