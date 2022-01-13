/* eslint-disable import/prefer-default-export */
import { readDir } from '../api';
import { Drive } from '../components';

import { UserDocumentJSON } from '../components/users'

export class State {
    public user: UserDocumentJSON;

    public fileList: ReadDirectoryResponse;

    public selectedFiles: SelectedFile[];

    public currentDir: string;

    public response: APIResponse;

    public menu: Menu;

    public dialog: Dialog;

    public history: StateHistory;

    public drag = false;

    public preview: StatePreviewFile;

    public upload: StateUploadInterface;

    public mode!: 'account' | 'filesExplorer' | 'users'

    public drive: Drive

    constructor(
      user: UserDocumentJSON,
      fileList: ReadDirectoryResponse,
      drive: Drive,
      currentDir: string = user.root
    ) {
      this.user = user;
      this.fileList = fileList;
      this.selectedFiles = [];
      this.currentDir = currentDir;
      this.response = {
        action: 'none', error: false, message: '', fileResults: [], folderResults: [], from: '', to: ''
      }
      this.menu = { active: 0, location: { name: '', type: '' } };
      this.dialog = { type: '', status: false }
      this.history = { _back: false, _forward: false, count: 0 };
      this.preview = { viewer: false, file: '', currentlyViewing: false };
      this.upload = { status: false, file: '' };
      this.drive = drive
      this.mode = 'filesExplorer'
    }

    async update <T extends State, P extends keyof State>(newState?: { [key in P]: T[P]}): Promise<void> {
      if (newState) {
        Object.assign(this, newState);
      }

      const files = await readDir(this.currentDir);

      this.fileList = files;
    }

    async refresh <T extends State, P extends keyof State>(
      newState?: { [index in P]: T[P] }
    ) : Promise<void> {
      // get directory listing, and update state object if need be
      await this.update(newState)

      // tell files explorer to show the files
      this.drive.filesExplorer.getFiles()
    }
}
