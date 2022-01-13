/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import drive from '../index'
import { previewDownloadHandler } from '../events'

import * as elements from '../bindings/dom'
import { fileTypes } from '../bindings'

/**
 * Sets the dim element's height and width to window size,
 * and adds the 'active' class to the dim element.
 * Doesn't add or modify any properties on thedrive.state object
 */

export function showDim() {
  elements.dim.style.width = `${window.innerWidth}px`
  elements.dim.style.height = `${window.innerHeight}px`
  elements.dim.classList.add('active')
}

/**
 *
 * Essentially, sets the 'active' class on the elements
 * that need to come into view.
 *
 */
export function displayPreview(viewer: any, filename: string): void {
  let img: string

  const type = filename.split('.').pop()!.toLowerCase()

  // set the filetype icon on the file view header
  if (type === undefined || !Object.prototype.hasOwnProperty.call(fileTypes, type)) {
    img = '/images/unknown.png'
  } else {
    img = `/images/${type}.png`
  }

  // setting the header's content
  elements.fileviewTitleText.innerHTML = filename
  elements.fileviewFiletypeImage.src = img

  showDim()

  // the main container for all preview elements
  elements.fileviewContainer.classList.add('active')

  document.querySelector('html')?.classList.add('inpreview')

  if (!viewer) {
    elements.downloadMainButtonDownload.addEventListener('click', previewDownloadHandler)
    elements.downloadMain.classList.add('active')
  } else {
    if (viewer.name === 'PDFViewer') {
      elements.previewViewport.classList.add('active')
      elements.previewViewportThumbs.classList.add('active')
      return
    }

    if (viewer.name === 'GViewer') {
      elements.iFrameWrapper.classList.add('active')
    }

    if (viewer.name === 'DocViewer') {
      elements.iFrameWrapper.classList.add('active')
    }
  }
}

export function resizeDim(height?: number|string): void {
  if (!elements.dim.classList.contains('active')) {
    return
  }

  elements.dim.style.width = `${window.innerWidth}px`

  if (!height) {
    elements.dim.style.height = `${window.innerHeight}px`
    return
  }

  if (typeof height === 'number') {
    elements.dim.style.height = `${height + 200}px`

    return
  }

  if (typeof height === 'string') {
    elements.dim.style.height = height
  }
}

export function hideDim(): void {
  elements.dim.classList.remove('active')
}

export function hideDialog(): void {
  hideDim()

  const dialogs = [elements.newFolderEl, elements.renameDiv, elements.fileviewContainer]

  dialogs.forEach((dialog) => dialog.classList.remove('active'))

  drive.state.dialog.status = false
  drive.state.dialog.type = ''
  drive.state.menu.location = { name: '', type: '' }
}

export function hidePreviewElements(): void {
  const html = document.getElementsByTagName('html')[0]

  html.classList.remove('inpreview');

  [
    elements.fileviewContainer,
    elements.downloadMain,
    elements.previewViewport,
    elements.previewViewportThumbs,
    elements.iFrameWrapper,
  ]
    .forEach((element) => {
      element.classList.remove('active')
    })

  while (elements.previewViewportThumbs.firstChild) {
    elements.previewViewportThumbs.removeChild(elements.previewViewportThumbs.firstChild)
  }

  while (elements.previewViewportFull.firstChild) {
    elements.previewViewportFull.removeChild(elements.previewViewportFull.firstChild)
  }

  while (elements.iFrameWrapper.firstChild) {
    elements.iFrameWrapper.removeChild(elements.iFrameWrapper.firstChild)
  }

  hideDialog()

  drive.state.preview.currentlyViewing = false
}

export function hideMenu(event?: MouseEvent, force = false): void {
  if (force || !event) {
    [elements.pathMenu, elements.fileMenu, elements.folderMenu].forEach((m) => m.classList.remove('active'))
    drive.state.menu.active = 0
    return
  }

  if (!drive.state.menu.active) {
    return
  }

  const menu = [elements.pathMenu, elements.fileMenu, elements.folderMenu].find((m) => m.classList.contains('active'))

  if (!menu) {
    return
  }

  // want to close the pathMenu if the click was NOT on the path div
  if (menu === elements.pathMenu) {
    if (!(event.target as HTMLElement).closest('#path')) {
      menu.classList.remove('active')
      drive.state.menu.active = 0
      return
    }
    return
  }

  // if the menu is NOT the pathMenu, we want to close the menu on any click outside the menu
  const target = event.target as HTMLElement
  let closest: null | false | Element = target.closest('.active')

  if (
    closest === document.querySelector('#files-container')
    || closest === document.querySelector('#navigation-container.file-nav')
  ) {
    closest = false
  }

  if (!closest) {
    menu.classList.remove('active')
    drive.state.menu.active = 0
  }
}

export function showDialog<T extends Dialog['type']>(type: T, filename = 'unknown'): EventListener {
  return (): string | false => {
    showDim()
    hideMenu(undefined, true)

    if (type === 'new_folder') {
      elements.newFolderText.value = ''
      elements.newFolderEl.classList.add('active')
      elements.newFolderText.focus()
      drive.state.dialog.status = true
      drive.state.dialog.type = 'new_folder'
      return 'new_folder'
    }

    if (type === 'rename') {
      elements.renameText.value = ''
      elements.renameDiv.classList.add('active')
      elements.renameText.focus()
      drive.state.dialog.status = true
      drive.state.dialog.type = 'rename'
      return 'rename'
    }

    if (type === 'download') {
      const ext = filename.split('.')?.pop() || 'unknown'
      elements.fileviewFiletypeImage.src = `/images/${ext}.png`
      elements.fileviewTitleText.innerHTML = filename as string
      elements.fileviewContainer.classList.add('active')
      drive.state.dialog.status = true
      drive.state.dialog.type = 'download'
      return 'download'
    }

    return false
  }
}

export function showMenu(event: MouseEvent): void {
  if (!event.currentTarget) {
    return
  }

  let menu
  const onPath = event.currentTarget === document.querySelector('.path-dir:last-child')
  const onFolder = (event.currentTarget as HTMLDivElement).className === 'folder-div'
  const onFile = (event.currentTarget as HTMLDivElement).className === 'file-div'

  if (onPath) menu = elements.pathMenu
  if (onFolder) menu = elements.folderMenu
  if (onFile) menu = elements.fileMenu

  if (!menu) {
    return
  }

  if (drive.state.menu.active === 1) {
    hideMenu(event)
  }

  if (window.innerWidth - event.clientX < 200) {
    menu.style.left = `${event.clientX - 180}px`
  } else {
    menu.style.left = `${event.clientX}px`
  }

  if (window.innerHeight - event.clientY < 180) {
    menu.style.top = `${event.pageY - 180}px`
  } else {
    menu.style.top = `${event.pageY}px`
  }

  menu.classList.add('active')
  drive.state.menu.active = 1
}

export function highlight(): void {
  const allFiles: NodeListOf<HTMLDivElement> = document.querySelectorAll('.folder-div, .file-div')
  allFiles.forEach((file) => {
    const name = file.getAttribute('data-name')
    if (drive.state.selectedFiles.some((sFile) => sFile.name === name)) {
      // eslint-disable-next-line no-param-reassign
      file.style.backgroundColor = 'rgb(225, 225, 247)'
    } else {
      // eslint-disable-next-line no-param-reassign
      file.style.backgroundColor = ''
    }
  })
}

export function closeDialog(event: MouseEvent): void {
  function close(dialog: HTMLElement) {
    hideDim()
    dialog.classList.remove('active')
  }

  // account settings window
  if ((event.target as HTMLDivElement).closest('.account-settings')) {
    close(elements.accountSettingsWrapper)
  }
}
