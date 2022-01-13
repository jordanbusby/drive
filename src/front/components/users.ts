import { Drive } from "./drive";
import { statTimeParse } from '../api/misc'
import * as Joi from 'joi'

export interface UserDocumentJSON {
    createdAt: string
    email: string
    groups: Array<string>
    level: 'user' | 'admin' | 'super'
    history: Array<any>
    lastLogin?: string
    name: string
    organization: string
    root: string
    rootArray: Array<string>
    updatedAt: string
    _id: string
    messages: Array<any>
    loggedIn: boolean
}

export interface OrganizationDocumentJSON {
    companyName: string
    companyImage: string
    employees: Array<string>
    folderAbsolutePath: string
    folderAbsolutePathArray: Array<string>
    folderName: string
    _id: string
    createdAt: string
    updatedAt: string
}

export interface DBQueryAPIResponse<T extends OrganizationDocumentJSON | UserDocumentJSON> {
    error: boolean
    queryResult?: Array<T>
    message?: string
}

interface UsersState {
    change: boolean
    read: number
    userlist: Array<UserDocumentJSON>
    companylist: Array<OrganizationDocumentJSON>
}

const domUsersWrapper = document.querySelector('div.users--wrapper') as HTMLDivElement
const domTableBody = document.querySelector('tbody.userlist') as HTMLElement
const domNewuserSpan = document.querySelector('.addnew_span') as HTMLSpanElement
const domNewuserInputs = document.querySelectorAll<HTMLInputElement>('.newuser_input')
const domNewuserValids = document.querySelectorAll<HTMLDivElement>('.vresult')
const domNewuserAdduser = document.querySelector('.poprow--newuser_button') as HTMLButtonElement
const domDeleteSelectedButton = document.querySelector('.userlist-buttons .delete') as HTMLButtonElement

const domNewuserCompanySelect = document.querySelector('.poprow--company_select') as HTMLSelectElement
const domNewuserTypeSelect = document.querySelector('.poprow--type_select') as HTMLSelectElement

const domNewuserNameInput = document.querySelector('.poprow--name_input') as HTMLInputElement
const domNewuserNameValid = document.querySelector('.poprow--name_result') as HTMLDivElement

const domNewuserEmailInput = document.querySelector('.poprow--email_input') as HTMLInputElement
const domNewuserEmailValid = document.querySelector('.poprow--email_result') as HTMLDivElement

const domNewuserPasswordInput = document.querySelector('.poprow--password_input') as HTMLInputElement
const domNewuserPasswordValid = document.querySelector('.poprow--password_result') as HTMLDivElement

const domNewuserConfirmInput = document.querySelector('.poprow--confirm_input') as HTMLInputElement
const domNewuserConfirmValid = document.querySelector('.poprow--confirm_result') as HTMLDivElement



const name = Joi.string().min(3).max(128).trim().pattern(/^\w+\s\w+$/).rule({message: `'First Last' format required.`})
const email = Joi.string().min(6).max(128).lowercase().trim().pattern(/^\w+@\w+[.]{1}\w+/).rule({ message: `'MyAddress@MyEmail.xyz' format required.`})
const password = Joi.string().min(4).max(72).trim()

export class Users {
    public Drive!: Drive
    public DOM: { wrapper: HTMLDivElement } = { wrapper: domUsersWrapper }
    public data: UsersState = { change: true, read: Date.now(), userlist: [], companylist: [] }

    constructor(drive: Drive) {
        this.Drive = drive
        this.addEventListeners()
    }

    async show() {
        this.DOM.wrapper.classList.add('active')
        this.buildList()
    }

    hide() {
        this.DOM.wrapper.classList.remove('active')
    }

    addEventListeners() {
        domNewuserSpan.addEventListener('click', this.displayNewuserRows)
        this.nameInputListener()
        this.emailInputListener()
        this.passwordInputListener()
        this.confirmInputListener()
        domNewuserAdduser.addEventListener('click', () => this.addUser())//setting the 'onclick' property equal to an arrow function. That arrow function's [[ThisMode]] is 'lexical'. Thus, it's this value is defined by the surrounding scope, which is addEventListeners(), thus, this is the Users instance
        domDeleteSelectedButton.addEventListener('click', this.deleteSelectedUsers)//setting the 'onclick' property equal to this.deleteSelectedUsers. So, HTMLButtonElement.onclick = deleteSelectedUsers, so HTMLButtonElement.onclick() --> 'this' is strict mode, undefined
    }

    async queryUserDB(query = {}): Promise<DBQueryAPIResponse<UserDocumentJSON>> {
        const queryRequest = await fetch('/db/query/user', {
            method: 'POST',
            body: JSON.stringify(query),
            headers: new Headers([['Content-Type', 'application/json']])
        })

        if (!queryRequest.ok) {
            console.log(queryRequest.statusText)
        }

        return queryRequest.json()
    }

    async queryOrganizationDB(query = {}): Promise<DBQueryAPIResponse<OrganizationDocumentJSON> | undefined> {

        const queryResult = await fetch('/db/query/org', {
            method: 'POST',
            body: JSON.stringify(query),
            headers: new Headers([['Content-Type', 'application/json']])
        })

        return queryResult.json()
    }

    async refreshData() {
        if (!this.data.change) {
            return
        }
        const [userResponse, companyResponse] = await Promise.all([this.queryUserDB(), this.queryOrganizationDB()])

        if (userResponse.error) {
            console.log(userResponse.message)
            return
        }

        if (companyResponse && companyResponse.error || !companyResponse) {
            console.log(companyResponse?.message)
            return
        }

        this.data.userlist = userResponse.queryResult!
        this.data.companylist = companyResponse.queryResult!
        this.data.change = false
        this.data.read = Date.now()
    }

    async buildList() {

        await this.refreshData()
        const orgs = await this.queryOrganizationDB()

        while (domNewuserCompanySelect.children.length) {
            domNewuserCompanySelect.removeChild(domNewuserCompanySelect.children[0])
        }

        if (orgs && orgs.queryResult) {
            orgs.queryResult.forEach(org => domNewuserCompanySelect.insertAdjacentHTML('afterbegin', 
            `<option value="${org.companyName}">${org.companyName}</option>`
            ))
        }


        while (domTableBody.children.length > 6) {
            domTableBody.removeChild(domTableBody.children[0])
        }

        let html = ''
        this.data.userlist.forEach(user => {
            html += /*html*/
            `
            <tr class="mainrow">
            <td class="row--checkbox_td"><input class="row--checkbox_input" type="checkbox"></td>
            <td class="row--name_td"><span class="row--name_span">${user.name} </span><span class="row--company_span">/ ${user.organization}</span></td>
            <td class="row--email_td"><span class="row--email_span">${user.email}</span></td>
            <td class="row--lastseen_td"><span class="row--lastseen_span">${user.lastLogin ? statTimeParse(user.lastLogin) : '-'}</span></td>
            <td class="row--online_td"><span class="row--${user.loggedIn ? 'online' : 'offline'}_span"></span></td>
          </tr>
            `
        })

        domTableBody.insertAdjacentHTML('afterbegin', html)
    }

    displayNewuserRows(event: Event) {
        document.querySelectorAll('.addnew--poprow').forEach(row => row.classList.toggle('active'))
        domNewuserInputs.forEach(input => input.value = '')
        domNewuserValids.forEach(div => {
            div.innerHTML = ''
            div.classList.remove('error')
        })
    }

    nameInputListener() {
        let timeoutID: any

        const handler = (event:Event) => {
            const input = event.currentTarget as HTMLInputElement
            clearTimeout(timeoutID)

            timeoutID = setTimeout(() => {
                if (!input.value) {
                    domNewuserNameValid.classList.remove('error')
                    domNewuserNameValid.innerHTML = ''
                    return
                }

                const result = name.validate(input.value)

                if (!result.error) {
                    domNewuserNameValid.classList.remove('error')
                    domNewuserNameValid.innerHTML = ''
                } else {
                    domNewuserNameValid.classList.add('error')
                    domNewuserNameValid.innerHTML = result.error.message
                }
            }, 600)
        }
        domNewuserNameInput.addEventListener('input', handler)
    }

    emailInputListener() {
        let timeoutID: any

        const handler = (event:Event) => {
            clearTimeout(timeoutID)
            const input = event.currentTarget as HTMLInputElement
            timeoutID = setTimeout(() => {
                if (!input.value) {   
                    domNewuserEmailValid.classList.remove('error')
                    domNewuserEmailValid.innerHTML = ''
                    return
                }
                const result = email.validate(input.value)
                if (!result.error) {
                    domNewuserEmailValid.classList.remove('error')
                    domNewuserEmailValid.innerHTML = ''
                } else {
                    domNewuserEmailValid.classList.add('error')
                    domNewuserEmailValid.innerHTML = result.error.message
                }
            }, 600)
        }
        domNewuserEmailInput.addEventListener('input', handler)
    }

    passwordInputListener() {
        let timeoutID: any

        function showError(error: string) {
            domNewuserPasswordValid.innerHTML = error
            domNewuserPasswordValid.classList.add('error')
        }

        function hideError() {
            domNewuserPasswordValid.innerHTML = ''
            domNewuserPasswordValid.classList.remove('error')
        }

        const showConfirmError = (error: string) => {
        domNewuserConfirmValid.innerHTML = error
        domNewuserConfirmValid.classList.add('error')
        }

        const hideConfirmError = () => {
        domNewuserConfirmValid.classList.remove('error')
        domNewuserConfirmValid.innerHTML = ''
        }

        function handler(event: Event) {
            clearTimeout(timeoutID)
            const input: HTMLInputElement = event.currentTarget as HTMLInputElement
            timeoutID = setTimeout(() => {
                if (!input.value) {
                    hideError()
                    return
                }

                const result = password.validate(input.value)

                if (result.error) {
                    showError(result.error.message)
                    return
                }

                hideError()

                if (domNewuserConfirmInput.value && (domNewuserConfirmInput.value !== input.value)) {
                    if (!domNewuserConfirmInput.classList.contains('error')) {
                        showConfirmError('Passwords must match!')
                    }
                }
                
                if (input.value && !domNewuserConfirmInput.value) {
                    showConfirmError('Passwords must match!')
                }

                if (domNewuserConfirmInput.value && domNewuserConfirmInput.value === input.value) {
                    hideConfirmError()
                    hideError()
                }

            }, 750)
        }

        domNewuserPasswordInput.addEventListener('input', handler)
    }

    confirmInputListener() {

        const showError = (error: string) => {
            domNewuserConfirmValid.innerHTML = error
            domNewuserConfirmValid.classList.add('error')
        }

        const hideError = () => {
            domNewuserConfirmValid.innerHTML = ''
            domNewuserConfirmValid.classList.remove('error')
        }

        const hidePasswordError = () => {
            domNewuserPasswordValid.classList.remove('error')
            domNewuserPasswordValid.innerHTML = ''
        }

        const showPasswordError = (error: string) => {
            domNewuserPasswordValid.innerHTML = error
            domNewuserPasswordValid.classList.add('error')
        }

        let timeoutID: any

        const handler = (event: Event) => {
            const input: HTMLInputElement = event.currentTarget as HTMLInputElement

            clearTimeout(timeoutID)
            timeoutID = setTimeout(() => {
                
                if (!input.value) {
                    hidePasswordError()
                    hideError()
                    return
                }

                if (domNewuserPasswordInput.value === '') {
                    showPasswordError('You must enter a password first')
                }

                const result = password.validate(input.value)

                if (result.error) {
                    showError(result.error.message)
                    return
                }

                if (input.value !== domNewuserPasswordInput.value) {
                    showError('Passwords must match!')
                    return
                } 
                
                hideError()

            }, 750)
        }

        domNewuserConfirmInput.addEventListener('input', handler)
    }

    async addUser() {
        let error = false
        document.querySelectorAll('.vresult').forEach( (div, ind) => {
            if (div.classList.contains('error')) {
                error = true
                domNewuserInputs[ind].focus()
                return
            }

        })
        if (error) {
            console.log(`error: ${error}`)
            return
        }

        const organization = this.data.companylist.find(orgs => orgs.companyName === domNewuserCompanySelect.value) as OrganizationDocumentJSON

        const data = {
            name: domNewuserNameInput.value,
            email: domNewuserEmailInput.value,
            password: domNewuserPasswordInput.value,
            passwordConfirm: domNewuserConfirmInput.value,
            level: domNewuserTypeSelect.value,
            organization: organization.companyName,
            root: '/' + organization.folderAbsolutePathArray.join('/')
        }

        console.log(data.root)

        const request = await fetch('/register', {
            method: 'POST',
            body: JSON.stringify(data),
            headers: new Headers([['Content-Type', 'application/json']])
        })

        const result = await request.json()

        document.querySelector('.users-result')!.innerHTML = result.message

    }

    deleteSelectedUsers() {
        alert('Not yet implemented')
    }
}