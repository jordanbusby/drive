/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-use-before-define */
interface AuthenticationResponse {
    action: 'login' | 'logout';
    error: boolean;
    message: string | Error;
}

interface UploadChunkResponseInterface {
    error: boolean;
    message: string;
    chunk: number;
}

interface ProgressCache {
    [key: string]: number;
}

interface ActiveConnections {
    [index: number]: XMLHttpRequest;
}

interface InitResponse {
    error: boolean;
    id: string;
    message: string;
}

interface ReadDirectoryResponse {
    files: Array<FileInformation>;
    folders: Array<FileInformation>;
}

interface FileResult {
    error: boolean;
    file: string;
    message: string;
}

interface FolderResult {
    error: boolean;
    folder: string;
    message: string;
}

interface APIResponse {
    fileResults: Array<FileResult>;
    folderResults: Array<FolderResult>;
    from: string;
    to: string;
    error: boolean;
    message: string;
    action: 'mv' | 'mkdir' | 'del' | 'rename' | 'upload' | 'none' | 'convert';
}

interface FileTypes {
    [key: string]: string;
}

interface WebKitFileList {
    readonly length: number;
    item(index: number): WebKitFile | null;
    [index: number]: WebKitFile;
    [Symbol.iterator](): IterableIterator<WebKitFile>;
}

interface WebKitInput extends HTMLInputElement {
    webkitdirectory: boolean;
}

interface User {
    id: number;
    name: string;
    email: string;
    password:string;
    org: string;
    root: string;
    level: string;
    groups: string[];
}

interface Menu {
    location: SelectedFile;
    active: 0 | 1;
}

interface Dialog {
    status: boolean;
    type: 'rename' | 'new_folder' | 'download' | '';
}

type DialogType = Pick<Dialog, 'type'>;

interface StateHistory {
    _back: boolean;
    _forward: boolean;
    count: number;
}

interface StatePreviewFile {
    viewer: any
    file: string;
    currentlyViewing: boolean;

}

type WebKitFile = File & {
    webkitRelativePath?: string;
}

interface StateUploadInterface {
    status: boolean;
    file: string;
}

interface Component {
    dom: HTMLElement;
    show(): void;
    hide(): void;
    registerListeners(): void;
}

interface ControlCenterInterface extends Component {
    sections: HTMLElement[]
    buttons: HTMLElement[]
    buttonClick(event: MouseEvent): void;
    getUsers(): Promise<void>;
}

declare namespace global {
    interface File {
        webkitRelativePath?: string;
    }
}

type Modes = AccountSettingsInterface | FilesExplorerInterface

type AccountSettingsInterface = Component

interface FilesExplorerInterface extends Component {
    getFiles(): void
}

interface UploadHandlerInterface {
    name: string;
    size: number;
    numChunks: number;
    concat: () => Buffer;
    pushChunk: (index: number, chunk: Buffer[], size: number) => boolean;
    getChunkLength: (chunk: number) => number;
    complete: () => boolean;
    dir: string | null;
    currentDir: string;
    absolutePath: string;
    start: number;
}

interface FileStorage {
    [index: string]: UploadHandlerInterface;
}

interface InitRequest {
    name: string;
    size: number;
    numChunks: number;
    currentDir: string;
    dir: string | null;
}

interface InitResponse {
    error: boolean;
    id: string;
    message: string;
}

interface ReadDirectoryResponse {
    files: Array<FileInformation>;
    folders: Array<FileInformation>;
}

interface FileInformation {
    name: string;
    type: string;
    created: Date | string;
    size: string;
}

interface FileResult {
    error: boolean;
    file: string;
    message: string;
}

interface FolderResult {
    error: boolean;
    folder: string;
    message: string;
}

interface SelectedFile {
    name: string;
    type: 'folder' | 'file' | '';
}

interface User {
    id: number;
    name: string;
    email: string;
    password:string;
    org: string;
    root: string;
}

interface Menu {
    location: SelectedFile;
    active: 0 | 1;
}

interface StateHistory {
    _back: boolean;
    _forward: boolean;
    count: number;
}

interface State {
    update(arg0: { selectedFiles: never[]; }): any;
    syncPage(): any;
    user: User;
    fileList: ReadDirectoryResponse;
    selectedFiles: SelectedFile[];
    currentDir: string;
    response: APIResponse;
    menu: Menu;
    dialog: Dialog;
    history: StateHistory;
}
