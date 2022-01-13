/* eslint-disable no-alert */
/* eslint-disable function-paren-newline */
/* eslint-disable consistent-return */
/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'

import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist/types/display/api';
import drive from '../index';
import { Loader } from '../components'

GlobalWorkerOptions.workerSrc = '/js/pdf.worker.js';

interface PDFViewerDOM {
  viewerContainer: HTMLDivElement
  toolbar: HTMLDivElement
  toolbarClose: HTMLDivElement
  viewerBody: HTMLDivElement
  mainCanvas: HTMLCanvasElement
  thumbnailSidebar: HTMLDivElement
  toggleSidebarButton: HTMLButtonElement
  selectSize: HTMLSelectElement
  canvasContainer: HTMLDivElement
  pdfPrint: HTMLDivElement
}

class PDFViewer2 {
  currentPageNum = 1

  DOM: PDFViewerDOM

  scale = 1

  pdf!: PDFDocumentProxy

  page!: PDFPageProxy

  filename: string

  loader: Loader

  constructor(filename: string) {
    this.filename = filename
    this.DOM = PDFViewer2.getDOM()
    this._bindListeners()
    this.loader = new Loader()
  }

  static getDOM(): PDFViewerDOM {
    return {
      viewerContainer: document.querySelector('.pdf-viewer--container') as HTMLDivElement,
      toolbar: document.querySelector('.pdf-viewer--toolbar') as HTMLDivElement,
      toolbarClose: document.querySelector('.pdf-viewer--toolbar_close') as HTMLDivElement,
      viewerBody: document.querySelector('.pdf-viewer--body') as HTMLDivElement,
      mainCanvas: document.querySelector('.pdf-viewer--body .main-canvas') as HTMLCanvasElement,
      thumbnailSidebar: document.querySelector('div.thumbnail-sidebar') as HTMLDivElement,
      toggleSidebarButton: document.querySelector('button.thumbnails-toggle') as HTMLButtonElement,
      selectSize: document.querySelector('.zoomer select') as HTMLSelectElement,
      canvasContainer: document.querySelector('.canvas-container') as HTMLDivElement,
      pdfPrint: document.querySelector('.printer') as HTMLDivElement
    }
  }

  async getPDF(): Promise<boolean> {
    const response = await fetch('/getpdf', {
      method: 'POST',
      headers: new Headers([['Content-Type', 'application/json']]),
      body: JSON.stringify({ filename: this.filename })
    })
    if (!response.ok) {
      return false
    }
    const fileBuffer = await response.arrayBuffer()
    const uint8 = new Uint8Array(fileBuffer)
    this.pdf = await getDocument({ data: uint8 }).promise
    return true
  }

  async useConvertAPI(): Promise<void> {
    // first pull doc from server, don't need it as an attachment for download in browser
    // just need it in buffer form thus I can use post request
    const filepath = `${drive.state.currentDir}/${this.filename}`
    const bufferRequest = await fetch('/docbuffer', {
      method: 'POST',
      headers: new Headers([['Content-Type', 'application/json']]),
      body: JSON.stringify({ filepath })
    })

    const bufferRequestData = await bufferRequest.arrayBuffer()

    // send buffer of docx to convert host, get buffer back, give buffer to pdfjs
    const convertRequest = await fetch('https://convert.agristoreast.com:3010/convert', {
      method: 'POST',
      headers: new Headers([['Content-Type', 'application/json']]),
      body: bufferRequestData
    })
    const uint8view = new Uint8Array(await convertRequest.arrayBuffer())
    this.pdf = await getDocument({ data: uint8view }).promise
  }

  async getFileData(): Promise<void> {
    const file = await fetch('/previewdata', {
      method: 'POST',
      body: JSON.stringify({ currentDir: drive.state.currentDir, filename: this.filename }),
      headers: new Headers([['Content-Type', 'application/json']])
    })

    const buffer = await file.arrayBuffer()
    const u8 = new Uint8Array(buffer)
    this.pdf = await getDocument({ data: u8 }).promise
  }

  showLoader(): void {
    this.loader.show()
  }

  /**
   * We don't have the file data on the frontend. So, no matter what,
   * we have to fetch it from the backend, and also, it will always
   * be a PDF file. Even if the user double clicks on a Word doc, the
   * returned stream will be a PDF BLOB.
   */
  async start(): Promise<void> {
    // fetch pdf data options
    const fetchOptions: RequestInit = {
      method: 'POST',
      body: JSON.stringify({
        absoluteFilePath: `${drive.state.currentDir}/${this.filename}`
      }),
      headers: new Headers([
        ['Content-Type', 'application/json']
      ])
    }

    const response = await fetch('/getpdf', fetchOptions)

    if (!response.ok) {
      alert(
        `
        Error retrieving file data. Please try again.
        Error: ${response.statusText}

        If error continue, please notify administrator.
      `)
      return
    }

    // get byte array (array buffer) of response
    const pdfArrayBuffer = await response.arrayBuffer()

    // get Buffer/ArrayBufferView from array buffer
    const int8view = new Uint8Array(pdfArrayBuffer)

    // Give the pdf buffer object to pdf.js and set 'this.pdf' to the result
    const setPdf = await this.setPdfBuffer(int8view)

    // if pdf.js fails to parse the buffer
    if (!setPdf) {
      console.log('Error in viewing PDF: setPdfBuffer failed. Review logs.')
      return
    }

    // bring PDF Viewer DOM Component into view
    await this.loadViewerDom()
  }

  async setPdfBuffer(buffer: Uint8Array): Promise<boolean> {
    try {
      this.pdf = await getDocument({ data: buffer }).promise
      return true
    } catch (e) {
      console.log(e)
      return false
    }
  }

  async loadViewerDom(): Promise<void> {
    this.DOM.selectSize.value = 'pagefit'
    this.DOM.selectSize.dispatchEvent(new Event('change'))
    await this.buildThumbnails()
    this.DOM.viewerContainer.classList.add('active')
    this.loader.hide()
  }

  async start2(): Promise<void> {
    const type = this.filename.split('.').slice(-1)[0].toLowerCase()
    if (type === 'pdf') {
      await this.getFileData()
    } else if (type === 'docx' || type === 'doc') {
      this.loader.show()
      const attemptToGetPdf = await this.getPDF()
      if (!attemptToGetPdf) {
        await this.useConvertAPI()
      }
    }
    this.DOM.selectSize.value = 'pagefit'
    this.DOM.selectSize.dispatchEvent(new Event('change'))
    await this.buildThumbnails()
    this.DOM.viewerContainer.classList.add('active')
    this.loader.hide()
  }

  async closeViewer(): Promise<void> {
    this.DOM.viewerContainer.classList.remove('active')
    await this.pdf.cleanup()
    for (const child of Array.from(this.DOM.thumbnailSidebar.children)) {
      this.DOM.thumbnailSidebar.removeChild(child)
    }
  }

  toggleSidebar(): void {
    this.DOM.thumbnailSidebar.classList.toggle('active')
  }

  async buildThumbnails(): Promise<void> {
    const getThumbsizePage = async (num: number): Promise<HTMLCanvasElement> => {
      const canvas = document.createElement('canvas')
      canvas.setAttribute('pagenumber', num.toString())
      canvas.addEventListener('click', this.scrollToPage)// [[ThisMode]] of function is strict, thus, this === HTMLCanvasElement, because, HTMLCanvasElement.onclick = this.scrollToPage
      canvas.classList.add('canvas-thumb')
      const canvasContext = canvas.getContext('2d') as CanvasRenderingContext2D
      const page = await this.pdf.getPage(num)
      const viewport = page.getViewport({ scale: 0.25 })
      canvas.height = viewport.height
      canvas.width = viewport.width

      await page.render({ canvasContext, viewport }).promise
      return canvas
    }

    for (let i = 1; i <= this.pdf.numPages; i++) {
      // eslint-disable-next-line no-await-in-loop
      const canvas = await getThumbsizePage(i)
      canvas.setAttribute('pdf-pagenum', i.toString())
      this.DOM.thumbnailSidebar.appendChild(canvas)
    }
  }

  async printDocument(): Promise<void> {
    const iframe = document.createElement('iframe')
    iframe.id = 'printframe'
    document.body.appendChild(iframe)
    /* eslint-disable-next-line operator-linebreak */
    iframe.srcdoc = /* html */
      `<!DOCTYPE html>
        <html>
        <head>
        <style>
          @media print {
            @page {
              margin: 0;
            }
            html {
              height: 100%;
              width: 100%;
            }
            body {
              margin: 0;
              padding: 0;
              height: 100%;
              width: 100%;
            }
            .print-canvas {
              height: 100%;
              width: 100%;
            }
          }
        </style>
        </head>
        <body></body>
        </html>
        `
    iframe.addEventListener('load', async () => {
      for (let i = 1; i <= this.pdf.numPages; i += 1) {
        /* eslint-disable-next-line no-await-in-loop */
        const page = await this.pdf.getPage(i)
        const viewport = page.getViewport({ scale: 2.5 })
        const canvas = document.createElement('canvas')
        const canvasContext = canvas.getContext('2d') as CanvasRenderingContext2D
        canvas.classList.add('print-canvas')
        canvas.height = viewport.height
        canvas.width = viewport.width
        /* eslint-disable-next-line no-await-in-loop */
        await page.render({ viewport, canvasContext, intent: 'print' }).promise
        console.dir(window.frames[0].document)
        window.frames[0].document.body.appendChild(canvas)
        console.log(`rendered page ${i} to print canvas.`)
      }
      iframe.contentWindow?.print()
      document.body.removeChild(iframe)
    })
  }

  async sizePageWidth(): Promise<void> {
    const drawPage = async (num: number) => {
      const { canvas, context } = PDFViewer2._canvasFactory(num)
      const page = await this.pdf.getPage(num)
      const bodyRect = document.body.getBoundingClientRect()
      const scale = (bodyRect.width / page.view[2]) * 0.94
      canvas.width = bodyRect.width * 0.94
      canvas.height = scale * page.view[3]
      const viewport = page.getViewport({ scale })
      await page.render({ canvasContext: context, viewport }).promise
      this.DOM.canvasContainer.appendChild(canvas)
    }

    this.DOM.selectSize.disabled = true
    this.clearCanvas()

    for (let i = 1; i <= this.pdf.numPages; i++) {
      // eslint-disable-next-line no-await-in-loop
      await drawPage(i)
    }
    this.DOM.selectSize.disabled = false
  }

  async sizePageFit(): Promise<void> {
    const drawPage = async (num: number) => {
      const bodyRect = document.body.getBoundingClientRect()
      const page = await this.pdf.getPage(num)
      const scale = bodyRect.height / page.view[3]
      const { canvas, context } = PDFViewer2._canvasFactory(num)
      canvas.classList.add('main-canvas')
      canvas.width = scale * page.view[2]
      canvas.height = bodyRect.height
      const viewport = page.getViewport({ scale })
      await page.render({ canvasContext: context, viewport }).promise
      this.DOM.canvasContainer.appendChild(canvas)
    }
    this.DOM.selectSize.disabled = true
    this.clearCanvas()
    for (let i = 1; i <= this.pdf.numPages; i++) {
      // eslint-disable-next-line no-await-in-loop
      await drawPage(i)
    }
    this.DOM.selectSize.disabled = false
  }

  async sizeActual(): Promise<void> {
    const drawPage = async (num: number) => {
      const page = await this.pdf.getPage(num)
      const { canvas, context } = PDFViewer2._canvasFactory(num)
      const { height, width } = page.getViewport({ scale: 1 })
      canvas.height = height
      canvas.width = width
      await page.render(
        { canvasContext: context, viewport: page.getViewport({ scale: 1 }) }
      ).promise
      this.DOM.canvasContainer.appendChild(canvas)
    }
    this.DOM.selectSize.disabled = true
    this.clearCanvas()
    for (let i = 1; i <= this.pdf.numPages; i++) {
      /* eslint-disable-next-line no-await-in-loop */
      await drawPage(i)
    }
    this.DOM.selectSize.disabled = false
  }

  scrollToPage(this: HTMLCanvasElement): void {
    const pagenum = this.getAttribute('pagenumber')
    const canvasList = Array.from(document.querySelectorAll<HTMLCanvasElement>('.main-canvas'))
    const mainPage = canvasList.find((canvas) => canvas.getAttribute('pagenumber') === pagenum) as HTMLCanvasElement
    mainPage.scrollIntoView({ behavior: 'smooth' })
  }

  static _canvasFactory(
    pagenum: number
  ): { canvas: HTMLCanvasElement, context: CanvasRenderingContext2D } {
    function contextMenu(e: Event) {
      e.preventDefault()
    }
    const canvas = document.createElement('canvas')
    canvas.classList.add('main-canvas')
    canvas.setAttribute('pagenumber', pagenum.toString())
    canvas.oncontextmenu = contextMenu
    const context = canvas.getContext('2d') as CanvasRenderingContext2D
    return ({ canvas, context })
  }

  clearCanvas(): void {
    while (this.DOM.canvasContainer.children[0]) {
      this.DOM.canvasContainer.removeChild(
        this.DOM.canvasContainer.children[0]
      )
    }
  }

  async selectSize(): Promise<void> {
    switch (this.DOM.selectSize.value) {
      case 'fullwidth':
        await this.sizePageWidth()
        break
      case 'pagefit':
        await this.sizePageFit()
        break
      case 'actualsize':
        await this.sizeActual()
        break
      default:
    }
  }

  _bindListeners(): void {
    const toggleSidebarFunction = () => {
      this.toggleSidebar()
    }
    const selectSizeFunction = () => {
      console.log(this)
      this.selectSize()
    }
    const printFunction = () => {
      this.printDocument()
    }
    const toolbarCloseFunction = async () => {
      this.DOM.selectSize.removeEventListener('change', selectSizeFunction)
      this.DOM.toolbarClose.removeEventListener('click', toolbarCloseFunction)
      this.DOM.toggleSidebarButton.removeEventListener('click', toggleSidebarFunction)
      this.DOM.pdfPrint.removeEventListener('click', printFunction)
      await this.closeViewer()
    }
    this.DOM.toolbarClose.addEventListener('click', toolbarCloseFunction)
    this.DOM.toggleSidebarButton.addEventListener('click', toggleSidebarFunction)
    this.DOM.selectSize.addEventListener('change', selectSizeFunction)
    this.DOM.pdfPrint.addEventListener('click', printFunction)
  }
}

export default PDFViewer2
