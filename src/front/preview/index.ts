import { GViewer } from './gviewer'
import PDFViewer2 from './pdfviewer'
import { MSViewer } from './msviewer'

export { PDFViewer2 as PDFViewer, GViewer, MSViewer }

/**
 * TODO
 * 1. Type everything properly in here
 * 2. Add picture file preview
 *
 * How to type getViewer:
 * use the closest() DOM type as an example:
 * closest<K extends keyof HTMLElementTagNameMap>(selector: K): HTMLElementTagNameMap[K] | null;
 *
 */

const previewTypes = {
  pdf: PDFViewer2,
  doc: PDFViewer2,
  docx: PDFViewer2,
  xls: MSViewer,
  xlsx: MSViewer
}

type PreviewTypes = typeof previewTypes
type ViewerTypes = keyof PreviewTypes

export function getViewer(filename: string): false | PreviewTypes[ViewerTypes] {
  function viewerType(k: PropertyKey): k is ViewerTypes {
    return Object.prototype.hasOwnProperty.call(previewTypes, k)
  }
  const ext = filename.split('.').pop()?.toLowerCase()
  if (!ext) {
    return false
  }
  return viewerType(ext) && previewTypes[ext]
}
