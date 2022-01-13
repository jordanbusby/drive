import drive from '../index'
import { iFrameWrapper } from '../bindings';

export class GViewer {
  public filename: string;
  public size: number;
  public googleURI: string;
  constructor(filename: string, size: number) {
    this.filename = filename;
    this.size = size;

    const path = drive.state.currentDir + '/' + filename;
    const downloadURL = new URL(location.origin + '/docview');;
    downloadURL.searchParams.append('path', path);

    //this.googleURI = 'https://docs.google.com/gview?url=' + downloadURL.href + '&embedded=true';

    this.googleURI = 'https://view.officeapps.live.com/op/view.aspx?src=' + encodeURIComponent(downloadURL.href);


    //<iframe src='https://view.officeapps.live.com/op/embed.aspx?src=http%3A%2F%2Fieee802%2Eorg%3A80%2Fsecmail%2FdocIZSEwEqHFr%2Edoc' width='100%' height='100%' frameborder='0'>This is an embedded <a target='_blank' href='http://office.com'>Microsoft Office</a> document, powered by <a target='_blank' href='http://office.com/webapps'>Office Online</a>.</iframe>
  }

  static type(): 'gview' {
    return 'gview';
  }

  async getContent() {

    function loadListen() {
      window.clearTimeout(timer);
      iFrameWrapper.classList.add('active');
      iframe.classList.add('active');
    }

    const iframe = document.createElement('iframe');

    iframe.addEventListener('load', loadListen);
    iframe.src = this.googleURI;

    iFrameWrapper.appendChild(iframe);

    let timer = window.setTimeout((): void => {
      iframe.removeEventListener('load', loadListen);
      iFrameWrapper.removeChild(iframe);
      console.log('refreshing...');
      this.getContent();
    }, 1900);


  }

  async load() {

    this.getContent();

  }

}