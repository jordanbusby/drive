import { iFrameWrapper } from '../bindings';
import drive from '../index'

export class MSViewer {
  public filename: string;
  public scale: number | undefined;
  public url: string;

  constructor(filename: string, scale?: number) {
    this.filename = filename;

    if (scale && typeof scale === 'number') {
      this.scale = Math.min(Math.floor(scale), 5);
    } else {
      this.scale = 1;
    }

    const path = drive.state.currentDir + '/' + filename;
    const downloadURL = new URL(location.origin + '/preview');
    downloadURL.searchParams.append('currentDir', drive.state.currentDir);
    downloadURL.searchParams.append('name', filename);

    this.url = 'https://view.officeapps.live.com/op/view.aspx?src=' + encodeURIComponent(downloadURL.href);
  }

  load() {
    console.log(this.url);
    const iframe = document.createElement('iframe');
    iframe.src = this.url;

    iFrameWrapper.appendChild(iframe);
    iFrameWrapper.classList.add('active');
    iframe.classList.add('active');
  }
}