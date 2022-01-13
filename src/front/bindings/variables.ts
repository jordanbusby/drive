export const fileTypes: FileTypes = {
    jpg: `<img src="/images/jpg.png" width="25" height="25">`,
    png: `<img src="/images/png.png" width="25" height="25">`,
    exe: `<img src="/images/exe.png" width="25" height="25">`,
    xls: `<img src="/images/excel.png" width="25" height="25">`,
    xlsx: `<img src="/images/excel.png" width="25" height="25">`,
    doc: `<img src="/images/doc.png" width="25" height="25">`,
    docx: `<img src="/images/doc.png" width="25" height="25">`,
    pdf: `<img src="/images/pdf.png" width="25" height="25">`,
    txt: `<img src="/images/txt.png" width="25" height="25">`,
    key: `<img src="/images/certificate.png" width="25" height="25">`,
    pem: `<img src="/images/certificate.png" width="25" height="25">`,
    crt: `<img src="/images/certificate.png" width="25" height="25">`,
    zip: `<img src="/images/zip.png" width="25" height="25">`,
    rar: `<img src="/images/zip.png" width="25" height="25">`,
    gzip: `<img src="/images/zip.png" width="25" height="25">`,
    gz: `<img src="/images/zip.png" width="25" height="25">`,
    "7z": `<img src="/images/zip.png" width="25" height="25">`,
    rdp: `<img src="/images/rdp.png" width="25" height="25">`,
    hlp: `<img src="/images/info.png" width="25" height="25">`,
    nfo: `<img src="/images/info.png" width="25" height="25">`,
    ini: `<img src="/images/ini.png" width="25" height="25">`,
    csv: `<img src="/images/excel.png" width="25" height="25">`,
    unknown: `<img src="/images/unknown.png" width="25" height="25">`
}



const months = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const timeRegExp = /(\d+)-(\d+)-(\d+)T(\d+):(\d+)/;