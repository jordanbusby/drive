import { signoutHandler } from '../events'
import { Drive } from './drive';

const menulinkUsers = document.querySelector('div.menulink-users') as HTMLDivElement
const menulinkCompanies = document.querySelector('div.menulink-company') as HTMLDivElement
const menulinkAccount = document.querySelector('div.menulink-account') as HTMLDivElement
const menulinkFiles = document.querySelector('div.menulink-files') as HTMLDivElement
const menulinkSignout = document.querySelector('div.menulink-signout') as HTMLDivElement

const dropdownLink = document.querySelector('div.header-menu-wrapper') as HTMLDivElement
const userCircle = document.querySelector('div.user-circle-menu') as HTMLDivElement



export class AccountMenu {
    constructor(
        public drive: Drive,
        public dom: HTMLDivElement = document.querySelector('div.header-dropdown-menu-wrapper') as HTMLDivElement,

    ) {
        this.registerListeners()
        this.buildMenu()
    }

    show() {
        this.dom.classList.add('active')
        this.dom.focus()
    }

    hide() {
        this.dom.classList.remove('active')
    }

    toggle() {
        this.dom.classList.toggle('active')
    }

    registerListeners() {
        dropdownLink.addEventListener('click', () => this.show())
        this.dom.addEventListener('blur', () => this.hide())
        menulinkFiles.addEventListener('click', () => this.drive.view = 'filesExplorer')
        menulinkSignout.addEventListener('click', signoutHandler)
        menulinkAccount.addEventListener('click', () => this.drive.view = 'account')
        menulinkUsers.addEventListener('click', event => {
            this.hide()
            this.drive.view = 'users'
        })
    }

    buildMenu() {
        const execArray = /^(\w)\w*\s(\w)/.exec(this.drive.state.user.name)
        const name = execArray && execArray[1] + execArray[2] || ''
        userCircle.innerHTML = name

        if (this.drive.state.user.level !== 'super') {
            this.dom.removeChild(menulinkUsers)
            this.dom.removeChild(menulinkCompanies)

        }
    }
}