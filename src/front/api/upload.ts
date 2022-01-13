/* eslint-disable no-plusplus */
/* eslint-disable no-alert */
/* eslint-disable no-param-reassign */
/* eslint-disable no-multi-assign */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prefer-destructuring */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  infoBoxProgressPercent, infoBoxTitle, infoBox, infoBoxProgressFill
} from '../bindings/dom'
import drive from '../index'

class Upload {
  public uploadDir: string

  public CHUNK_SIZE: number = 1024 * 512

  public MAX_CONNECTIONS = 5

  public chunks: number[] = []

  public numChunks = 0

  public files: WebKitFile[] = []

  public totalBytesSent = 0

  public fileBytesSent = 0

  public filesSent: string[] = []

  public totalSize = 0

  public currentFile = 0

  public numFiles: number

  public activeConnections: ActiveConnections = {}

  public serverBytesReceived = 0

  public id = ''

  public time = 0

  public progressCache: ProgressCache = {}

  public dirs: string[] = []

  public FILTERED_FILES: string[] = ['thumbs.db']

  public FILTERED_REGEX = /^[._~]+|\.db$/i;

  [index: string]: any

  constructor(fileList: WebKitFile[], uploadDir: string) {
    this.uploadDir = uploadDir

    for (const file of fileList) {
      this.files.push(file)
    }

    // filer out filtered names
    this.files = this.files.filter(
      (file) => this.FILTERED_FILES.indexOf(file.name.toLowerCase()) < 0
    )

    // filter out specified regex matches
    this.files = this.files.filter((file) => !this.FILTERED_REGEX.test(file.name))

    // count what we have left
    this.numFiles = fileList.length

    // add up the size
    for (const file of fileList) {
      this.totalSize += file.size
    }
  }

  init(file: WebKitFile): Promise<string> {
    // setup the file information on the object
    let dir: string | null = null
    this.numChunks = Math.ceil(file.size / this.CHUNK_SIZE)
    this.chunks = new Array(this.numChunks).fill(undefined).map((_, i) => i).reverse()

    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.addEventListener('readystatechange', (event) => {
        if (xhr.readyState === 4) {
          resolve(xhr.responseText)
        }
      })

      if (file.webkitRelativePath) {
        dir = file.webkitRelativePath.match(/^(.*)\/[^/]*$/)![1]
      }

      const initRequest = {
        size: file.size,
        name: file.name,
        numChunks: this.numChunks,
        currentDir: this.uploadDir,
        dir
      };

      xhr.open('POST', '/api/initupload')

      xhr.setRequestHeader('Content-Type', 'application/json')

      xhr.send(JSON.stringify(initRequest))
    });
  }

  uploadChunk(): Promise<UploadChunkResponseInterface> {
    return new Promise((resolve, reject) => {
      const file = this.files[this.currentFile]
      const chunk = this.chunks.pop()!;

      const start = chunk * this.CHUNK_SIZE
      const end = start + this.CHUNK_SIZE
      const blob = file.slice(start, end)
      const xhr = this.activeConnections[chunk] = new XMLHttpRequest()

      xhr.addEventListener('load', (event) => {
        this.fileBytesSent += this.progressCache[chunk]
        delete this.progressCache[chunk]
        resolve(JSON.parse(xhr.responseText))
      });

      xhr.addEventListener('abort', (event) => {
        alert('abort')
      });

      xhr.addEventListener('error', (event) => {
        console.log(event)
      });

      xhr.addEventListener('timeout', (event) => {
        alert('timeout')
      })

      xhr.upload.addEventListener('progress', (event) => {
        this.progressCache[chunk] = event.loaded
        const inProgress = Object.keys(this.progressCache)
          .reduce((total, current) => {
            total += this.progressCache[current]
            return total
          }, 0)

        const total = this.fileBytesSent + inProgress;
        const percent = Math.round((total / this.totalSize) * 100)
        infoBoxProgressFill.style.width = `${percent}%`
        infoBoxProgressPercent.innerHTML = `${percent}%`
      });

      xhr.open('POST', '/api/uploadchunk');

      xhr.setRequestHeader('x-file-id', this.id)
      xhr.setRequestHeader('x-chunk', chunk.toString())
      xhr.setRequestHeader('x-chunk-size', blob.size.toString())

      xhr.send(blob)
    });
  }

  uploadFile(): void {
    const activeConnections = Object.keys(this.activeConnections)

    if (!this.chunks.length) {
      if (!activeConnections.length) {
        this.complete()
        return
      }
      return;
    }

    if (activeConnections.length >= this.MAX_CONNECTIONS) {
      return;
    }

    this.uploadChunk()
      .then((response) => {
        if (response.error) {
          console.log(`deleting: ${response.chunk}`);
          delete this.activeConnections[response.chunk];
          this.chunks.push(response.chunk);
          this.uploadFile();
        }

        if (!response.error) {
          delete this.activeConnections[response.chunk];
          this.uploadFile();
        }
      })
      .catch((err) => {
        console.log('uploadFile(): Error in catch block.');
      });

    this.uploadFile();
  }

  async complete(): Promise<void> {
    this.filesSent.push(this.files[this.currentFile].name);

    if (this.currentFile === this.files.length - 1) {
      infoBoxTitle.innerHTML = 'Upload Complete';

      setTimeout(() => {
        infoBox.classList.remove('active');
      }, 500);

      drive.state.upload.status = false;
      drive.state.upload.file = '';

      await drive.state.refresh();
      return;
    }

    // go to next file, and restart the process.

    this.currentFile++;
    this.send();
  }

  send(): void {
    if (!this.files.length) {
      return;
    }

    drive.state.upload.status = true;

    if (!this.filesSent.length) {
      infoBoxProgressFill.style.width = '0%';
      infoBoxProgressPercent.innerHTML = '0%';
      infoBox.classList.add('active');
    }

    infoBoxTitle.innerHTML = `Uploading: ${this.files[this.currentFile].name}`;

    this.init(this.files[this.currentFile])
      .then((initResponse) => {
        const response: InitResponse = JSON.parse(initResponse);

        if (response.error) {
          console.log(response.message)
        }

        this.id = response.id;

        drive.state.upload.file = this.files[this.currentFile].name;

        this.uploadFile();
      }).catch((err) => {
        console.log(err);
      });
  }
}

export default Upload
