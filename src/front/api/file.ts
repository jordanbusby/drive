import {
  renameText,
  newFolderText,
  newFolderEl,
  dim,
} from '../bindings'
import drive from '../index'
import { hideDialog, hideMenu } from './display'
import Upload from './upload'

export function readDir(dir: string): Promise<ReadDirectoryResponse> {
  const options = {
    method: 'POST',
    body: JSON.stringify({ dir }),
    headers: { 'Content-Type': 'application/json' },
  }

  return fetch('/api/dir', options)
    .then((response) => {
      if (!response.ok) {
        return response.statusText
      }

      return response.json()
    })

    .catch((reason) => reason)
}

export function deleteFile(): Promise<APIResponse> {
  const { selectedFiles, currentDir } = drive.state

  const options = {
    method: 'POST',
    body: JSON.stringify({ selectedFiles, currentDir }),
    headers: {
      'Content-Type': 'application/json',
    },
  }

  return fetch('/api/delete', options)
    .then((response) => {
      if (!response.ok) {
        return response.statusText
      }

      return response.json()
    })

    .catch((reason) => reason)
}

export async function deleteSelected(event: MouseEvent): Promise<APIResponse> {
  hideMenu(event, true)

  if (drive.state.selectedFiles.length === 0) {
    return Promise.reject(drive.state.selectedFiles.length)
  }

  const { selectedFiles, currentDir } = drive.state

  const request = {
    method: 'DELETE',
    body: JSON.stringify({ selectedFiles, currentDir }),
    headers: {
      'Content-Type': 'application/json',
    },
  }

  return fetch('/api/delete', request)
    .then((response) => {
      if (!response.ok) {
        // eslint-disable-next-line no-alert
        alert(`Error: ${response.statusText}`)
        return undefined
      }
      return response.json()
    })
    .then(async (json: APIResponse) => {
      drive.state.response = json
      await drive.state.update({ selectedFiles: [] })
      drive.filesExplorer.getFiles()
      return json
    })
}

export function uploadFolder(): void {
  const input: WebKitInput = document.createElement('input')
  input.type = 'file'
  input.webkitdirectory = true
  input.multiple = true

  input.addEventListener('change', function inputListener(this:HTMLInputElement) {
    if (!this.files) {
      return
    }
    const upload = new Upload([...this.files], drive.state.currentDir)
    upload.send()
  })
  input.click()
  input.remove()
}

export function uploadFile(): void {
  const input = document.createElement('input')
  input.type = 'file'
  input.multiple = true

  input.addEventListener('change', function inputListener(this: HTMLInputElement) {
    if (!this.files) {
      return
    }
    const upload = new Upload([...this.files], drive.state.currentDir)
    upload.send()
  })
  input.click()
  input.remove()
}

export function rename(): void {
  const { type, name } = drive.state.menu.location

  if (
    renameText.value === ''
    || renameText.value === 'Folder Name'
    || renameText.value === 'Please enter a folder name'
  ) {
    renameText.value = 'Please enter a folder name'
    return
  }

  const to = renameText.value
  const options = {
    method: 'POST',
    body: JSON.stringify({
      currentDir: drive.state.currentDir, type, from: name, to,
    }),
    headers: { 'content-type': 'application/json' },
  }

  hideDialog()
  fetch('/api/rename', options)
    .then((response) => {
      if (!response.ok) {
        // eslint-disable-next-line no-alert
        alert(`Error: ${response.statusText}`)
      }
      return response.json()
    })
    .then(async (json) => {
      drive.state.response = json
      await drive.state.update()
      drive.filesExplorer.getFiles()
      // eslint-disable-next-line no-console
      if (drive.state.response.error) console.log(drive.state.response.error)
    })
}

export function createFolder(): void {
  const newFolderName = newFolderText.value

  if (
    newFolderText.value === ''
    || newFolderText.value === 'Folder Name'
    || newFolderText.value === 'Please enter a folder name'
  ) {
    newFolderText.value = 'Please enter a folder name'
    return
  }

  fetch('/api/dir/create', {
    method: 'POST',
    headers: new Headers([['Content-Type', 'application/json']]),
    body: JSON.stringify({ currentDir: drive.state.currentDir, newFolderName }),
  })
    .then((response) => {
      if (!response.ok) {
        // eslint-disable-next-line no-alert
        alert(`Error: ${response.statusText}`)
      }

      return response.json()
    })

    .then(async (jsonResponse) => {
      drive.state.response = jsonResponse

      await drive.state.update()
      drive.filesExplorer.getFiles()
    })

    .catch(async (e) => {
      const response: APIResponse = {
        message: e,
        error: true,
        action: 'mkdir',
        from: '',
        to: '',
        fileResults: [],
        folderResults: [],
      }

      drive.state.response = response
      await drive.state.update()
      drive.filesExplorer.getFiles()
    })

    .finally(() => {
      [newFolderEl, dim].forEach((el) => el.classList.remove('active'))
    })
}

export function getDownloadURL(file: string): string {
  const url = new URL(`${window.location.origin}/download`)
  const params: { [key: string]: string } = { currentDir: drive.state.currentDir, name: file }

  Object.keys(params).forEach((key) => url.searchParams.append(key, params[key]))

  return url.href
}
