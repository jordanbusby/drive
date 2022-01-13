/* eslint-disable no-console */
/* eslint-disable class-methods-use-this */
import drive from '../index'
import { StatsBase } from '../events/handlers'
import Upload from '../api/upload'

/**
 * New sync
 *
 * Once we get the FileStructure object back from the server,
 * it's got a nested object-dictionary of ComparedFiles.
 * Each level of nesting is a folder-name key, with another layer
 * for sub-folders, or filenames as keys with ComparedFile as values.
 * The only place we deal with DroppedFile (FileSystemEntry) objects,
 * is in the constructor, and in build(), to remove the arrayBuffer method
 * and other extraneous properties from the FileSystemEntry object before
 * we send it to the server.
 */

type DroppedFile = Pick<File, 'lastModified' | 'name' | 'size' | 'type'> & {
    webkitRelativePath: string
}

type ComparedFile = DroppedFile & {
    action: 'add' | 'delete' | 'overwrite' | 'ignore'
    stats?: StatsBase
}

interface FileStructure {
    [index: string]: FileStructure | ComparedFile
}

const container = document.querySelector('.main-container') as HTMLDivElement
const listContainer = document.querySelector('.list-container') as HTMLDivElement
const close = document.querySelector('.newsync_close') as HTMLDivElement
const syncButton = document.querySelector('.newsync_start') as HTMLButtonElement
const filterButtons: {[index:string]:HTMLButtonElement} = {
  all: document.querySelector('.filters > .all') as HTMLButtonElement,
  add: document.querySelector('.filters > .add') as HTMLButtonElement,
  delete: document.querySelector('.filters > .del') as HTMLButtonElement,
  overwrite: document.querySelector('.filters > .ow') as HTMLButtonElement,
}

class Newsync {
    fileEntries: WebKitFile[]

    currentDir: string

    constructor(fileEntries: WebKitFile[], currentDir: string) {
      this.fileEntries = fileEntries
      this.currentDir = currentDir
      this.show()
      this.build()
    }

    handleEvent(e:Event): void {
      e.stopPropagation()

      const target = e.currentTarget as HTMLElement

      if (target === close) {
        this.hide()
        return
      }

      if (target === syncButton) {
        this.sync()
        return
      }

      if (target.classList.contains('action')) {
        this.changeAction(target)
        return
      }

      // file and folder select
      if (target.classList.contains('foldername')) {
        target.closest('.folder')?.classList.toggle('selected')
        return
      }

      if (target.closest('.filters')) {
        if (target === filterButtons.all) {
          Object.keys(filterButtons).forEach((btn) => (filterButtons[btn] !== filterButtons.all ? filterButtons[btn].classList.remove('on') : undefined))
          target.classList.toggle('on')
        } else {
          filterButtons.all.classList.remove('on')
          target.classList.toggle('on')
        }
        this.filter()
      }
    }

    filter(): void {
      if (filterButtons.all.classList.contains('on')) {
        document.querySelectorAll<HTMLDivElement>('.file')
          .forEach((file) => file.classList.add('viewing'))
        return
      }

      const actionArray = Array.from(document.querySelectorAll<HTMLButtonElement>('.filter.on'))
        .map((btn) => btn.innerHTML)
        .reduce((prev, curr) => `${prev} ${curr}`, '')
        .split(' ')

      document.querySelectorAll<HTMLDivElement>('.file').forEach((file) => {
        // const re = /\saction--(\w+)/
        const classes = file.classList.toString()
        const actionExecArr = /action--(\w+)/.exec(classes) as RegExpExecArray
        const [, action1] = actionExecArr

        if (actionArray.indexOf(action1) !== -1) {
          file.classList.add('viewing')
        } else {
          file.classList.remove('viewing')
        }
      })
    }

    async sync(): Promise<void> {
      const setActionAttribute = ((): void => {
        const spanArr = document.querySelectorAll<HTMLSpanElement>('.action')
        spanArr.forEach((span) => span.closest('.file')?.setAttribute('data-action', span.childNodes[0].nodeValue as string))
      })
      setActionAttribute()
      const allFiles = document.querySelectorAll<HTMLElement>('.file')
      const uploadFileElements = Array.from(allFiles).filter((elt) => elt.dataset.action === 'add' || elt.dataset.action === 'overwrite')
      const deleteFileElements = Array.from(allFiles).filter((elt) => elt.dataset.action === 'delete')
      const uploadFilesMap: { [index:string]: { [index:string]: string | undefined } } = {}
      const deleteFilesMap: { [index:string]: { [index:string]: string | undefined } } = {}

      // USE A Map INSTEAD OF AN Object for Dictionaries!!

      uploadFileElements.forEach((elt) => {
        uploadFilesMap[elt.dataset.name as string] = {
          filename: elt.dataset.name,
          action: elt.dataset.action,
          path: elt.dataset.path,
        }
      })

      deleteFileElements.forEach((elt) => {
        deleteFilesMap[elt.dataset.name as string] = {
          filename: elt.dataset.name,
          action: elt.dataset.action,
          path: elt.dataset.path,
        }
      })

      if (Object.keys(deleteFilesMap).length) {
        fetch('/api/deletesync', {
          method: 'POST',
          headers: new Headers([['Content-Type', 'application/json']]),
          body: JSON.stringify({ files: deleteFilesMap, directory: this.currentDir }),
        }).then((response) => {
          if (!response.ok) {
            console.log(response.statusText)
          }
          return response.json()
        })
          .then(console.log)
          .catch(console.log)
      }

      const filteredFiles = this.fileEntries.filter(
        (file) => Object.prototype.hasOwnProperty.call(uploadFilesMap, file.name)
      )

      new Upload(filteredFiles, this.currentDir).send()
      this.removeEventListeners()
      this.hide()
      await drive.state.refresh()
    }

    changeAction(target: HTMLElement): void {
      const file = target.closest<HTMLElement>('.file') as HTMLDivElement
      const originalAction = file.dataset.action
      const currentAction = target.childNodes[0].nodeValue
      const action = target.childNodes[0]

      if (originalAction === 'add') {
        if (currentAction === 'add') {
          action.nodeValue = 'ignore'
          file.classList.replace('action--add', 'action--ignore')
        } else {
          action.nodeValue = 'add'
          file.classList.replace('action--ignore', 'action--add')
        }
      }

      if (originalAction === 'ignore') {
        if (currentAction === 'ignore') {
          action.nodeValue = 'overwrite'
          file.classList.replace('action--ignore', 'action--overwrite')
        } else if (currentAction === 'overwrite') {
          action.nodeValue = 'delete'
          file.classList.replace('action--overwrite', 'action--delete')
        } else {
          action.nodeValue = 'ignore'
          file.classList.replace('action--delete', 'action--ignore')
        }
      }

      if (originalAction === 'delete') {
        if (currentAction === 'delete') {
          action.nodeValue = 'ignore'
          file.classList.replace('action--delete', 'action--ignore')
        } else {
          action.nodeValue = 'delete'
          file.classList.replace('action--ignore', 'action--delete')
        }
      }

      if (originalAction === 'overwrite') {
        if (currentAction === 'overwrite') {
          action.nodeValue = 'ignore'
          file.classList.replace('action--overwrite', 'action--ignore')
        } else if (currentAction === 'ignore') {
          action.nodeValue = 'delete'
          file.classList.replace('action--ignore', 'action--delete')
        } else {
          action.nodeValue = 'overwrite'
          file.classList.replace('action--delete', 'action--overwrite')
        }
      }
    }

    removeEventListeners(): void {
      close.removeEventListener('click', this)
      Object.keys(filterButtons).forEach((btn) => filterButtons[btn].removeEventListener('click', this))
      syncButton.removeEventListener('click', this)
    }

    addEventListeners(): void {
      close.addEventListener('click', this)
      syncButton.addEventListener('click', this)
      document.querySelectorAll<HTMLDivElement>('.foldername, .file, .filters > *').forEach((elt) => elt.addEventListener('click', this))
      document.querySelectorAll<HTMLImageElement>('.action').forEach((elt) => elt.addEventListener('click', this))
    }

    show(): void {
      container.classList.add('active')
    }

    hide(): void {
      container.classList.remove('active')
      this.clearList()
      this.removeEventListeners()
    }

    clearList(): void {
      while (listContainer.children.length) {
        listContainer.removeChild(listContainer.children[0])
      }
    }

    async build(): Promise<void> {
      function build(path: FileStructure, folder: HTMLElement = listContainer) {
        let markup = ''
        const files:string[] = []
        const folders:string[] = []
        // eslint-disable-next-line
        Object.keys(path).forEach((key) => isFile(path[key]) ? files.push(key) : folders.push(key))
        const randomID = Math.floor(Math.random() * 100)

        folders.forEach((foldername) => {
          markup /* html */
                += `
                <div class="item folder" data-type="folder" data-name="${foldername}" data-folderid="${randomID}" tabindex="0">
                    <img src="/images/folder.png">
                    <span class="foldername">${foldername}</span>
                </div>`
        })

        files.forEach((filename) => {
          const file = path[filename] as ComparedFile
          const type = file.webkitRelativePath.split('.').pop() || 'unknown'
          markup /* html */
                += `
                <div class="item file action--${file.action}" data-type="file" data-name="${filename}" data-action="${file.action}" data-path="${file.webkitRelativePath}" tabindex="0">
                    <img src="/images/${type}.png">
                    <span class="filename">${file.name}</span>
                    <span class="action">${file.action}<img src="/images/sync-change.png"></span>
                </div>`
        })

        folder.insertAdjacentHTML('beforeend', markup)

        folders.forEach((fol) => build(path[fol] as FileStructure, document.querySelector(`.item.folder[data-name="${fol}"][data-folderid="${randomID}"]`) as HTMLDivElement))
      }

      const has = Object.prototype.hasOwnProperty
      const fileListInfo = this.fileEntries.map((file) => ({
        size: file.size,
        lastModified: file.lastModified,
        name: file.name,
        webkitRelativePath: file.webkitRelativePath,
        type: file.type,
      }))

      const compareRequest = await fetch('/api/newcompare', {
        method: 'POST',
        body: JSON.stringify({ files: fileListInfo, directory: drive.state.currentDir }),
        headers: new Headers([['Content-Type', 'application/json']]),
      })

      const result: FileStructure = await compareRequest.json()
      build(result)
      this.addEventListeners()

      function isFile(o: FileStructure | ComparedFile):o is ComparedFile {
        return has.call(o, 'action')
      }
    }

    static parse(root: FileStructure): { [index:string]: Array<ComparedFile> } {
      const has = Object.prototype.hasOwnProperty
      const folders: { [index:string]: Array<ComparedFile> } = {}
      const crawl = (branch: FileStructure): void => {
        Object.keys(branch).forEach((key) => {
          const val = branch[key]
          if (Newsync.isFile(val)) {
            const path = val.webkitRelativePath.slice(1).split('/').slice(0, -1).join('/')
            if (!has.call(folders, path)) {
              folders[path] = []
            }
            folders[path].push(val)
            return
          }
          crawl(root)
        })
      }
      crawl(root)
      return folders
    }

    static isFile(o: FileStructure | ComparedFile): o is ComparedFile {
      return Object.prototype.hasOwnProperty.call(o, 'existing')
    }
}

export default Newsync
