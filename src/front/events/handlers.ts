import drive from '../index'
import {
  createFolder,
  deleteFile,
  findPath,
  hideMenu,
  highlight,
  rename,
  showDialog,
  showMenu,
  uploadFile,
  uploadFolder,
  displayPreview,
  getDownloadURL,
  hidePreviewElements,
  resizeDim,
  hideDialog,
  logout
} from '../api';
import * as elements from '../bindings'
import {
  getViewer, GViewer, MSViewer, PDFViewer
} from '../preview';
import { Newsync } from '../components'

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

export interface ComparedFile {
  lastModified: number
  name: string
  webkitRelativePath: string
  size: number
  defaultAction: 'add' | 'overwrite' | 'ignore'
  existing: boolean
  newer?: boolean
  stats?: StatsBase
}

export interface ComparedFileDict {
  [index: string]: Array<ComparedFile>
}

async function dbclickFile(name: string): Promise<void> {
  const Viewer = getViewer(name)

  drive.state.preview = {
    viewer: !!Viewer,
    file: name,
    currentlyViewing: true
  }

  if (!Viewer) {
    displayPreview(undefined, name)
    return
  }

  const preview = new Viewer(name, 1)
  drive.state.preview.viewer = preview

  if (preview instanceof PDFViewer) {
    await preview.start()
    return
  }

  displayPreview(Viewer, name)

  if (preview instanceof MSViewer) {
    preview.load()
  }

  if (preview instanceof GViewer) {
    await preview.load()
  }
}

export async function dblclickHandler(this: HTMLDivElement): Promise<void> {
  const name = this.getAttribute('data-name');
  const type = this.className === 'folder-div' ? 'folder' : 'file';
  let fullPath;

  if (!name || !type) {
    return
  }

  if (type === 'file') {
    dbclickFile(name)
    return;
  }

  if (name === '..') {
    drive.state.history._back = true
    window.history.back()
  } else {
    fullPath = `${drive.state.currentDir}/${name}`
    window.history.pushState(fullPath, 'ASE drive')

    await drive.state.refresh({ currentDir: fullPath })
  }
}

function closePreviewHandler(event?: Event) {
  event?.preventDefault()
  hidePreviewElements()
}

export function previewDownloadHandler(): void {
  hidePreviewElements();
  const link = document.createElement('a');
  link.download = 'download';
  link.href = getDownloadURL(drive.state.preview.file);
  link.click();
  link.remove();
}

export function menuDownloadHandler(this: HTMLDivElement): void {
  hideMenu();

  const { name } = drive.state.selectedFiles[0];

  if (!name) {
    return
  }

  const url = getDownloadURL(name);

  const link = document.createElement('a');
  link.href = url;
  link.download = 'download';
  link.click();
  link.remove();
}

export async function pdfThumbClick(this: HTMLCanvasElement): Promise<void> {
  const thumbs = document.querySelectorAll<HTMLCanvasElement>('#pdfthumb');

  thumbs.forEach((thumbnail) => {
    thumbnail.classList.remove('selected');
  });

  this.classList.add('selected');

  const { viewer } = drive.state.preview;

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const pagenum = +this.getAttribute('data-pdfthumb-page')!;

  const selectPage = viewer.selectPage.bind(viewer);

  await selectPage(pagenum);
}

export function fileMouseDown(this: HTMLDivElement, event: MouseEvent): void {
  if (event.button !== 0) {
    return
  }

  const name = this.getAttribute('data-name');
  const type: 'file' | 'folder' = this.className === 'folder-div' ? 'folder' : 'file';
  const alreadySelected = drive.state.selectedFiles.some((s) => s.name === name) === true;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onlySelected = alreadySelected && drive.state.selectedFiles.length === 1;

  if (!name || !type) {
    return;
  }

  const ctrlMouseUp = () => {
    drive.state.selectedFiles = drive.state.selectedFiles.filter(
      (file: SelectedFile) => file.name !== name
    )
    highlight();
    this.removeEventListener('mouseup', ctrlMouseUp);
  }

  if (drive.state.menu.active === 1) {
    hideMenu(event);
  }

  /**  CTRL + MOUSEDOWN  * */

  if (event.ctrlKey && !event.shiftKey) {
    if (alreadySelected) {
      this.addEventListener('mouseup', ctrlMouseUp);
    } else {
      drive.state.selectedFiles.push({ name, type });
      highlight();
    }
  } else if (event.shiftKey && !event.ctrlKey) { /**  SHIFT KEY + MOUSEDOWN  * */
    if (!alreadySelected && drive.state.selectedFiles.length === 0) {
      drive.state.selectedFiles.push({ name, type });
      highlight();
    } else if (!alreadySelected && drive.state.selectedFiles.length > 0) {
      let elementArray: Array<HTMLDivElement> = Array.from(document.querySelectorAll('.folder-div') as NodeListOf<HTMLDivElement>).concat(Array.from(document.querySelectorAll('.file-div') as NodeListOf<HTMLDivElement>));

      const lastSelectedIndex = elementArray.findIndex((el) => el.getAttribute('data-name') === drive.state.selectedFiles.slice(-1)[0].name);

      const clickedFileIndex = elementArray.findIndex((el) => el.getAttribute('data-name') === name);

      elementArray = elementArray.filter(
        (_, index) => index >= Math.min(lastSelectedIndex, clickedFileIndex)
        && index <= Math.max(lastSelectedIndex, clickedFileIndex)
      )

      elementArray.forEach((el) => {
        const elementName = el.getAttribute('data-name') as string;
        const elementType: 'file' | 'folder' = el.className === '.file-div' ? 'file' : 'folder';

        if (!drive.state.selectedFiles.some((file) => file.name === elementName)) {
          drive.state.selectedFiles.push({ name: elementName, type: elementType })
        }
      });

      highlight()
    }
  } else if (event.button === 0 && !event.ctrlKey) { /**  JUST MOUSEDOWN / FALL THROUGH  * */
    drive.state.selectedFiles = []
    drive.state.selectedFiles.push({ name, type })
    highlight()
  }

  /**  WATCH FOR DRAG  (BY WATCHING MOUSELEAVE AND SEEING IF THEY ARE HOLDING LEFT MOUSE BUTTON)  */

  const setDrag = (evt: MouseEvent) => {
    if (evt.buttons === 1) {
      drive.state.drag = true
    }
    this.removeEventListener('mouseleave', setDrag);
  }

  if (name === '..') return

  this.addEventListener('mouseleave', setDrag)
}

export function contextMenu(this: HTMLElement, event: MouseEvent): void {
  event.preventDefault()

  const name = this.getAttribute('data-name')
  const type: 'file' | 'folder' = this.className === 'folder-div' ? 'folder' : 'file'

  if (!name || !type) {
    return
  }

  drive.state.selectedFiles = []
  drive.state.selectedFiles.push({ name, type })
  highlight()
  drive.state.menu.location = { name, type }
  showMenu(event)
}

export function mouseEnterFolder(this: HTMLDivElement, event: MouseEvent): void {
  if (!drive.state.drag || event.buttons !== 1 || drive.state.selectedFiles.length === 0) {
    return
  }

  const allFolders: NodeListOf<HTMLDivElement> = document.querySelectorAll('.folder-div, .file-div')

  // eslint-disable-next-line no-param-reassign
  allFolders.forEach((folder) => { folder.style.border = '' })

  this.style.border = '2px solid black';

  const mouseLeaveFolder = () => {
    this.style.border = ''
    this.removeEventListener('mouseleave', mouseLeaveFolder)
  }

  this.addEventListener('mouseleave', mouseLeaveFolder)
}

export function drop(this: HTMLDivElement, event: MouseEvent): void {
  if (!drive.state.drag || drive.state.selectedFiles.length === 0 || event.button !== 0) {
    return
  }

  const info = {
    currentDir: drive.state.currentDir,
    selectedFiles: drive.state.selectedFiles
  };

  this.style.border = '';
  const name = this.getAttribute('data-name');

  fetch('/api/move', { method: 'POST', body: JSON.stringify({ state: info, to: name }), headers: { 'Content-Type': 'application/json' } })
    .then((response) => {
      if (!response.ok) {
        // eslint-disable-next-line no-alert
        alert(`Error moving files: ${response.statusText}`);
      }
      return response.json();
    })
    .then(async (json: APIResponse) => {
      drive.state.response = json;
      await drive.state.update({ selectedFiles: [] })
      drive.filesExplorer.getFiles();
    });

  drive.state.drag = false;
}

/* eslint-disable */
async function dropFileHandler(evt: DragEvent) {
  if (!evt.dataTransfer || !evt.dataTransfer.items) {
    return
  }

  let flatFiles: WebKitFile[] = []
  const itemArray: any[] = []

  // get all FileSystemEntry objects, put them in array
  for (let i = 0; i < evt.dataTransfer.items.length; i += 1) {
    const current = evt.dataTransfer.items[i].webkitGetAsEntry()
    itemArray.push(current)
  }

  // loop through array, flatten all the files into an array,
  // and add the full path to the file objects as webkitRelativePath
  
  for (const item of itemArray) {
    if (item.isFile) {
      const file = await addFile(item)
      flatFiles.push(file);
    }
    if (item.isDirectory) {
      const files = await crawl(item)
      flatFiles = flatFiles.concat(files)
    }
  }

  const sync = new Newsync(flatFiles, drive.state.currentDir)

  function addFile(entry: any): Promise<WebKitFile> {
    return new Promise((resolve, reject) => {
      entry.file((file: File) => {
        Object.defineProperty(file, 'webkitRelativePath', { value: entry.fullPath, configurable: true, enumerable: true });
        resolve(file);
      }, (err: Error) => {
        reject(err);
      });
    });
  }

  async function getEntries(reader: any) {
    const completeEntries: any[] = [];
    let receivedEntries: any[] = await iterateEntries()

    while (receivedEntries.length) {
      receivedEntries.forEach((entry: any) => completeEntries.push(entry));
      receivedEntries = await iterateEntries()
    }

    return completeEntries


    function iterateEntries(): Promise<any[]> {
      return new Promise((resolve) => {
        reader.readEntries((entries: any) => {
          resolve(entries);
        });
      });
    }
  }

  async function crawl(entry: any): Promise<WebKitFile[]> {
    const files: WebKitFile[] = [];
    let returnedEntries: any = await getEntries(entry.createReader());

    while (returnedEntries.length) {
      const currentEntry = returnedEntries.shift();
      if (currentEntry.isFile) {
        const currentFile: any = await addFile(currentEntry);
        files.push(currentFile);
      }

      if (currentEntry.isDirectory) {
        let returnedCurrentEntry
        try {
          returnedCurrentEntry = await getEntries(currentEntry.createReader())
        } catch (e) {
          // eslint-disable-next-line no-console
          console.log(e)
        }
        returnedEntries = returnedEntries.concat(returnedCurrentEntry);
      }
    }
    return files;
  }
}
/* eslint-enable */

function dragHandler(event: DragEvent) {
  event.preventDefault();
  if (event.dataTransfer) {
    // eslint-disable-next-line no-param-reassign
    event.dataTransfer.dropEffect = 'copy';
  }

  if (event.type === 'drop') {
    dropFileHandler(event)
  }
}

async function unloadHandler(event: BeforeUnloadEvent): Promise<void> {
  if (drive.state.upload.status) {
    event.preventDefault();
    // eslint-disable-next-line no-param-reassign
    event.returnValue = 'Are you sure?'
  }
}

function windowResizeHandler(event: Event, height?: string | number) {
  resizeDim(height)
}

/**
 * Deletes selected files.
 * @todo Add error handling
 */
async function deleteHandler(event: MouseEvent): Promise<void> {
  hideMenu(event, true);

  const result: APIResponse = await deleteFile();

  if (typeof result === 'string') {
    return
  }

  drive.state.response = result
  await drive.state.refresh()
}

/**
 *
 * This function is still being developed. Functionality
 * is hit or miss, especially on Safari/Apple devices.
 * On Chrome/Windows, it was working pretty cleanly.
 *
 * Keep in mind this event is fired AFTER the page has
 * completed browsing. Thus, we will fire off a XHR
 * after the browse. This is a costly browse, but is the only
 * way to handle keeping the forward/back buttons working
 * in the browser.
 *
 */
async function popStateHandler(event: PopStateEvent) {
  hideDialog();
  hidePreviewElements();

  // future use maybe
  drive.state.history._back = false
  drive.state.history._forward = false

  if (!event.state) {
    await drive.state.refresh({ currentDir: drive.state.user.root })

    // create a new state and activate it since the history
    // stack doesn't know where we're at
    window.history.pushState(drive.state.user.root, 'ASE drive', null)
  } else {
    await drive.state.refresh({ currentDir: event.state })
  }
}

/**
 *
 * This function updates the history.state object after
 * a successful XHR. It actually doesn't know if the XHR
 * is successful or not, which needs to be changed.
 *
 */
export async function pathmenuBrowse(this: HTMLDivElement): Promise<void> {
  const folder = this.getAttribute('data-name')

  if (!folder) {
    return
  }

  const path = findPath(folder)

  if (!path) {
    await drive.state.refresh({ currentDir: drive.state.user.root });
    window.history.pushState(drive.state.user.root, 'ASE drive', null);
    return
  }

  await drive.state.refresh({ currentDir: path });
  window.history.pushState(path, 'ASE drive', null);
}

export async function signoutHandler(this: HTMLDivElement): Promise<void> {
  await logout();
  window.location.assign('/login');
}

export function addEventListeners(): void {
  /** FILE MENU * */
  elements.filemenuDownload.addEventListener('click', menuDownloadHandler);

  /** FILE VIEWER CONTAINER */
  elements.fileviewClose.addEventListener('click', closePreviewHandler);

  /** DOWNLOAD: PREVIEW UNAVAILABLE  */
  elements.downloadMainButtonsCancel.addEventListener('click', hidePreviewElements);

  /** UPLOAD  */
  elements.pathmenuUploadFile.addEventListener('click', uploadFile);
  elements.addControl.addEventListener('click', uploadFile);
  elements.uploadFolderLinks.forEach((link) => link.addEventListener('click', uploadFolder));

  /** DELETE */
  elements.deleteControl.addEventListener('click', deleteHandler);
  elements.folderMenuDelete.addEventListener('click', deleteHandler);
  elements.fileMenuDelete.addEventListener('click', deleteHandler);

  /** NEW FOLDER  */
  document.querySelectorAll('.newfolder-link').forEach((el) => {
    el.addEventListener('click', showDialog('new_folder'));
  });
  elements.newFolderCreate.addEventListener('click', createFolder);
  [elements.newFolderCancel, elements.newFolderClose].forEach((button) => button.addEventListener('click', () => [elements.newFolderEl, elements.dim].forEach((el) => el.classList.remove('active'))));

  /** RENAME */
  document.querySelectorAll('.rename-link').forEach((link) => {
    link.addEventListener('click', showDialog('rename'));
  });

  elements.renameConfirmButton.addEventListener('click', rename);

  [elements.renameCancelButton, elements.renameClose].forEach((button) => button.addEventListener('click', () => [elements.renameDiv, elements.dim].forEach((el) => el.classList.remove('active'))));

  /** RENAME -- LISTEN FOR ENTER */
  elements.renameText.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') {
      return;
    }
    rename()
  })

  elements.newFolderText.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') {
      return
    }
    createFolder()
  });

  /** DRAG HANDLER
   *
   *  Needs reworked. Since it's watching the entire window,
   *  it calls these handlers on random elements or non-file
   *  drags.
   *
   * */
  window.addEventListener('dragover', dragHandler);
  window.addEventListener('drop', dragHandler);

  /**
   *
   * Window resize
   *
   */
  window.addEventListener('resize', windowResizeHandler);

  /** Window beforeunload */
  window.addEventListener('beforeunload', unloadHandler);

  /** POPSTATE */
  window.addEventListener('popstate', popStateHandler);

  /** MENU */
  document.body.addEventListener('click', hideMenu);
}
