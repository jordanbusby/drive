/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-restricted-globals */
import { getLoggedInUser, readDir } from '../api';
import { addEventListeners } from '../events';
import { AccountMenu } from './menu';
import { State } from '../bindings';
import { FilesExplorer } from './filesexplorer';
import { MyAccount } from './my_account';
import { Users } from './users';

export interface DriveInstance {
    state: State
    filesExplorer: FilesExplorerInterface
    account: MyAccount
    users: Users
    view: any
    start(): Promise<void>
    initializeComponents(): void
}

type ModeInterface = 'filesExplorer' | 'account' | 'users'

export class Drive {
    public state!: State

    public filesExplorer!: FilesExplorer

    public accountMenu!: AccountMenu

    public account!: MyAccount

    public users!: Users

    async start(): Promise<void> {
      await this.initializeComponents()
      addEventListeners()
      history.pushState(this.state.user.root, 'ASE drive')
    }

    async initializeComponents(): Promise<void> {
      const user = await getLoggedInUser()
      const dir = await readDir(user.root)

      this.state = new State(user, dir, this)
      this.filesExplorer = new FilesExplorer(this)
      this.accountMenu = new AccountMenu(this)
      this.account = new MyAccount(this)
      this.users = new Users(this)
    }

    set view(v: 'filesExplorer' | 'account' | 'users') {
      console.log(`v: ${v}`)

      if (v === this.state.mode) {
        return
      }

      this[this.state.mode].hide()
      this[v].show()
      this.state.mode = v
    }

    get view(): ModeInterface {
      return this.state.mode
    }
}
