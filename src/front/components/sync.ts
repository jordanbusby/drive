import { Upload } from "../api"
import drive from '../index'
import type { ComparedFile, ComparedFileDict } from '../events/handlers'
import { fileTypes } from '../bindings'

const domWrapper = document.querySelector('.sync--wrapper') as HTMLDivElement
const domHeader = document.querySelector('.sync--header') as HTMLDivElement
const domClose = document.querySelector('.sync--header_close') as HTMLDivElement
const domTable = document.querySelector('table.synclist') as HTMLTableElement
const domTableBody = document.querySelector('.sync--synclist_body') as HTMLTableSectionElement
const domHeaderSelectActionFilter = document.querySelector('.synclist--header_select_action') as HTMLSelectElement

domClose.addEventListener('click', () => domWrapper.classList.remove('active'))

export type FileInformation = Pick<WebKitFile, 'lastModified' | 'name' | 'webkitRelativePath' | 'size'>

export interface StatsBase<T = number> {
  isFile(): boolean;
  isDirectory(): boolean;
  isBlockDevice(): boolean;
  isCharacterDevice(): boolean;
  isSymbolicLink(): boolean;
  isFIFO(): boolean;
  isSocket(): boolean;

  dev: T;
  ino: T;
  mode: T;
  nlink: T;
  uid: T;
  gid: T;
  rdev: T;
  size: T;
  blksize: T;
  blocks: T;
  atimeMs: T;
  mtimeMs: T;
  ctimeMs: T;
  birthtimeMs: T;
  atime: Date;
  mtime: Date;
  ctime: Date;
  birthtime: Date;
}

export interface FileCompareResponse {
  existing: boolean
  file: FileInformation
  stats?: StatsBase
  newer?: boolean
}

function parseDate(ms: number): string {
  const dateString = new Date(ms).toString()
  const re = /^(\w+)\s(\w+)\s(\d+)\s(\d+)\s(\d+):(\d+)/ig

  const [, day, month, numDay, year, hour, minute] = re.exec(dateString) as RegExpExecArray
  return `${month} ${numDay}, ${hour}:${minute}`
}

export class Sync {

  list: ComparedFileDict
  addList: ComparedFile[] = []
  ignoreList: ComparedFile[] = []
  overwriteList: ComparedFile[] = []
  DOM = { wrapper: domWrapper, tableBody: domTableBody }
  blobList: WebKitFile[];

  constructor(list: ComparedFileDict, blobList: WebKitFile[]) {
    this.list = list
    this.blobList = blobList
  }

  show(): void {
    this.build()
    this.addEventListeners()
    this.DOM.wrapper.classList.add('active')
  }

  hide(): void {
    this.DOM.wrapper.classList.remove('active')
  }

  addEventListeners() {
    document.querySelectorAll<HTMLSelectElement>('.sync--action_select').forEach(
      el => el.addEventListener('change', this.actionChangeListener)
    )
    this.draggableListener()
    document.querySelector('.sync--sync_files')?.addEventListener('click', () => this.syncFiles())
    document.querySelectorAll('.synclist--folder_row').forEach(row => row.addEventListener('click', this.showFileRows))
  }

  build() {

    while (this.DOM.tableBody.firstChild) {
      this.DOM.tableBody.removeChild(
        this.DOM.tableBody.firstChild
      )
    }

    for (let key of Object.keys(this.list)) {

      let folderHtml = /* html */
        `<tr class="synclist--folder_row" data-folder="${key}" tabindex="0">
              <td>
                  <div><input type="checkbox" class="synclist--folder_checkbox"></div>
                </td>
                <td class="folder_name" colspan="3">
                    <div>
                        <img src="/images/folder.png">
                  <span class="folder_name--currentdir">${drive.state.currentDir.split('/').pop()}</span>
                  <span class="folder_name--syncdir">${'/' + key} </span>
                  <span class="folder_name--numfiles"> - ${this.list[key].length} files</span>
                </div>
            </td>
        </tr>`
      const folder = this.list[key]
      folder.forEach(file => {
        folderHtml +=/* html */
          `<tr class="synclist--file_row ${file.defaultAction}" data-file="${file.name}">
                  <td>
                    <div class="file--checkbox_container"><input type="checkbox" class="synclist--file_checkbox"></div>
                  </td>
                  <td>
                    <div class="file--name_container">${fileTypes[file.name.split('.').pop()!] || fileTypes['unknown']}${file.name}</div>
                  </td>
                  <td>
                    <div class="file--date_container">${parseDate(file.lastModified)}</div>
                  </td>
                  <td>
                    <div class="file--size_container">${file.size}</div>
                  </td>
                </tr>`
      })
      this.DOM.tableBody.insertAdjacentHTML('beforeend', folderHtml)
    }
    Array.from(document.querySelectorAll<HTMLTableRowElement>('.synclist--file_row'))
      .forEach(row => row.addEventListener('click', this.fileRowClick))
  }

  fileRowClick(this: HTMLTableRowElement) {
    if (this.classList.contains('add')) {
      this.classList.add('ignore')
      this.classList.remove('add')
    } else if (this.classList.contains('ignore')) {
      this.classList.add('overwrite')
      this.classList.remove('ignore')
    } else {
      this.classList.add('add')
      this.classList.remove('overwrite')
    }
  }

  actionChangeListener(this: HTMLSelectElement, event: Event) {
    const row = this.closest('tr') as HTMLTableRowElement
    row.classList.remove('ignore', 'add', 'overwrite')
    row.classList.add(this.value)
  }

  draggableListener() {
    let drag = false, lastX = 0, lastY = 0
    function mouseDown(event: MouseEvent): void {
      drag = true
      lastX = event.clientX
      lastY = event.clientY

      document.addEventListener('mousemove', mouseMove)
      document.addEventListener('mouseup', mouseUp)
    }

    function mouseUp(event: Event): void {
      drag = false
    }

    function mouseMove(event: MouseEvent): void {
      if (!drag) return
      //if the mouse has moved to the right, event.clientX(the position of the mouse at the time of the event) will be LARGER than the LAST position, which was further to the left.
      const movedX = lastX - event.clientX
      //if the mouse has moved to the bottom, event.clientY will be larger than lastY, resulting in a negative moved value, thus - (-val) === +, which moves it down. 
      const movedY = lastY - event.clientY
      lastX = event.clientX
      lastY = event.clientY

      domWrapper.style.left = (domWrapper.offsetLeft - movedX) + 'px'
      domWrapper.style.top = (domWrapper.offsetTop - movedY) + 'px'
    }

    domHeader.addEventListener('mousedown', mouseDown)
  }

  selectActionChange(event: Event) {
    const select = event.currentTarget as HTMLSelectElement

  }

  syncFiles() {
    const rows = Array.from(document.querySelectorAll<HTMLTableRowElement>('.synclist--file_row'))
    let filenames: string[] = []
    let uploads: WebKitFile[] = []

    rows.forEach(row => {
      if (row.classList.contains('ignore')) return
      const filename = row.getAttribute('data-file')
      if (filename) {
        filenames.push(filename)
      } else {
        console.log('Didn\'t find a filename')
        console.log(row)
      }
    })

    filenames.forEach(filename => {
      const file = this.blobList.find(blob => blob.name === filename)
      if (file) {
        uploads.push(file)
      } else {
        console.log('Didn\'t match a filename')
        console.log(filename)
      }
    })

    const upload = new Upload(uploads, drive.state.currentDir)
    upload.send()
    this.hide()
  }

  showFileRows(this: HTMLTableRowElement, event: Event) {
    let row = this.nextElementSibling as HTMLTableRowElement
    while (row) {
      if (!row.classList.contains('synclist--file_row')) break
      row.classList.toggle('active')
      row = row.nextElementSibling as HTMLTableRowElement
    }

  }
}