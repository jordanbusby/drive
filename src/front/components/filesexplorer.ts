import { showMenu, statTimeParse } from "../api"
import { fileTypes } from "../bindings"
import { contextMenu, dblclickHandler, drop, fileMouseDown, mouseEnterFolder, pathmenuBrowse } from "../events"
import type { Drive } from "./drive"

export class FilesExplorer {
    public dom: HTMLElement
    public drive: Drive
    public pathdom: HTMLElement
    public navdom: HTMLElement

    constructor(drive: Drive){
        this.drive = drive
        this.dom = document.querySelector('#files-container') as HTMLDivElement
        this.pathdom = document.getElementById("path") as HTMLElement
        this.navdom = document.querySelector('#navigation-container') as HTMLElement

        this.getFiles()
        this.show()
    }

    show() {
        this.dom.classList.add('active')
        this.navdom.classList.add('active')
    }

    hide() {
        this.dom.classList.remove('active')
        this.navdom.classList.remove('active')
    }

    getFiles() {

        this.drive.state.selectedFiles = [];

        if (this.dom.children[1]) { 
            this.dom.replaceChild(this.buildDirectoryElements(this.drive.state.fileList), this.dom.children[1])
            } else {
            this.dom.appendChild(this.buildDirectoryElements(this.drive.state.fileList));
            }
        
            this.buildPath();
    }

    buildDirectoryElements({files, folders}: ReadDirectoryResponse) {

        let resultDiv = document.createElement("div");
        resultDiv.id = "result-div";
    
        if (this.drive.state.currentDir !== this.drive.state.user.root) {
    
            let folderBack = document.createElement("div");
            folderBack.className = "folder-div";
            folderBack.setAttribute("data-name", "..");
            let folderBackNameDiv = document.createElement("div");
            folderBackNameDiv.className = "foldername-div";
            folderBackNameDiv.innerHTML = `<img src="/images/folderback.png" width="25" height="25"> <p>..</p>`;
            let folderBackDateDiv = document.createElement("div");
            folderBackDateDiv.className = "folderdate-div";
            folderBackDateDiv.innerHTML = "--";
            let folderBackSizeDiv = document.createElement("div");
            folderBackSizeDiv.className = "foldersize-div";
            folderBackSizeDiv.innerHTML = "--";
            folderBack.append(folderBackNameDiv);
            folderBack.append(folderBackDateDiv);
            folderBack.append(folderBackSizeDiv);
            folderBack.addEventListener("dblclick", dblclickHandler);
            folderBack.addEventListener("click", fileMouseDown);
            resultDiv.appendChild(folderBack);
    
        }
    
        if (folders) {
        folders.forEach(folder => {
            let folderDiv = document.createElement("div");
            folderDiv.className = "folder-div";
            folderDiv.setAttribute("data-name", folder.name);
            let nameDiv = document.createElement("div");
            let dateDiv = document.createElement("div");
            let sizeDiv = document.createElement("div");
            nameDiv.className = "foldername-div";
            dateDiv.className = "folderdate-div";
            sizeDiv.className = "foldersize-div";
            nameDiv.innerHTML = `<img src="/images/folder.png" width="25" height="25"> <p>${folder.name}</p>`;
            dateDiv.innerHTML = statTimeParse(folder.created as string);
            sizeDiv.innerHTML = folder.size;
            folderDiv.append(nameDiv);
            folderDiv.append(dateDiv);
            folderDiv.append(sizeDiv);
            folderDiv.addEventListener("contextmenu", contextMenu);
            folderDiv.addEventListener("mouseenter", mouseEnterFolder);
            folderDiv.addEventListener("mousedown", fileMouseDown);
            folderDiv.addEventListener("mouseup", drop);
            folderDiv.addEventListener("dblclick", dblclickHandler);
            resultDiv.appendChild(folderDiv);
            });
        }
        if (files) {
        files.forEach(file => {
    
            let fileDiv = document.createElement("div");
            fileDiv.className = "file-div";
            fileDiv.setAttribute("data-name", file.name);
    
            let nameDiv = document.createElement("div");
            let dateDiv = document.createElement("div");
            let sizeDiv = document.createElement("div");
    
            nameDiv.className = "filename-div";
            dateDiv.className = "filedate-div";
            sizeDiv.className = "filesize-div";
    
            let type = file.type;
            if (!Object.prototype.hasOwnProperty.call(fileTypes, file.type)) {
                type = 'unknown';
            }
    
            nameDiv.innerHTML = `${fileTypes[type]} ${file.name}`;
            dateDiv.innerHTML = statTimeParse(file.created as string);
            sizeDiv.innerHTML = file.size;
    
            fileDiv.append(nameDiv);
            fileDiv.append(dateDiv);
            fileDiv.append(sizeDiv);
    
            fileDiv.addEventListener("contextmenu", contextMenu);
            fileDiv.addEventListener("mousedown", fileMouseDown);
            fileDiv.addEventListener("dblclick", dblclickHandler);
    
            resultDiv.appendChild(fileDiv);
            });
        }
    
        return resultDiv;
    }

    buildPath() {

        while (this.pathdom.firstChild) {
            this.pathdom.removeChild(this.pathdom.firstChild);
        }
    
        const dir = this.drive.state.currentDir;
        let dirArr = dir.split('/').slice(1);
    
        dirArr.splice(0, dirArr.indexOf(this.drive.state.user.root.split('/').pop()!));
    
        //down arrow image
        const downArrow = document.createElement('img');
        downArrow.id = 'path_down_arrow';
        downArrow.src = '/images/down.png';
    
        
        //loop through the PATH
        for (let i = 0; i < dirArr.length; i++) {
    
            let displayName = i === 0 ? this.drive.state.user.organization : dirArr[i];
    
            const folder = document.createElement('div');
            folder.classList.add('path-dir');
            folder.innerHTML = `<p>${displayName}</p>`;
            folder.setAttribute('data-name', dirArr[i]);
    
            this.pathdom.appendChild(folder)
            
            //is this folder the cwd?
            if (i === dirArr.length - 1) {
                folder.addEventListener('click', showMenu);
                folder.appendChild(downArrow);
                return;
            }
    
            //folder divide image
            const divide = document.createElement('img');
            divide.classList.add('path-divide');
            divide.src = '/images/next.png';
    
            this.pathdom.appendChild(divide);
    
            folder.addEventListener('click', pathmenuBrowse);
        }
    }
}