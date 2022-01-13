import { Drive } from './drive'
import * as joi from 'joi'

export interface UserDocument extends Document {
    email: string;
    name: string;
    password: string;
    organization: string;
    root: string;
    passwordMatch(s: string): Promise<boolean>;
    level: string;
    groups: string[];
    rootArray: string[];
    lastLogin: Date
    history: object[]
}

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

const name = joi.string().min(3).max(128).trim().pattern(/^\w+\s\w+$/).rule({message: `'First Last' format required.`})
const email = joi.string().min(6).max(128).lowercase().trim().pattern(/^\w+@\w+[.]{1}\w+/).rule({ message: `'MyAddress@MyEmail.xyz' format required.`})
const password = joi.string().min(4).max(72).trim()
const updateSchema = joi.object({ email, name, password, passwordConfirm: joi.valid(joi.ref('password')) }).with('password', 'passwordConfirm')


const priviledgedSidebar = document.querySelectorAll('div.priv')
const nameInput = document.querySelector('input.name-input') as HTMLInputElement
const emailInput = document.querySelector('input.email-input') as HTMLInputElement
const passwordInput = document.querySelector('input.password-input') as HTMLInputElement
const passwordConfirmInput = document.querySelector('input.passwordconfirm-input') as HTMLInputElement
const nameInputPopup = document.querySelector('div.name-input-error-popup') as HTMLDivElement
const emailInputPopup = document.querySelector('div.email-input-error-popup') as HTMLDivElement
const passwordInputPopup = document.querySelector('div.password-input-error-popup') as HTMLDivElement
const passwordConfirmInputPopup = document.querySelector('div.passwordconfirm-input-error-popup') as HTMLDivElement
const updateButton = document.querySelector('.update-account-button') as HTMLDivElement
const updateResultStatus = document.querySelector('.update-result') as HTMLDivElement


const menuUsers = document.querySelector('.sidebar-users') as HTMLDivElement
const menuAccount = document.querySelector('.sidebar-account') as HTMLDivElement

const FIVE_MINUTES = 1000 * 60 * 5

const userlistWrapper = document.querySelector('.userlist-wrapper') as HTMLDivElement
const userlistOrgDropdown = document.querySelector('select.organization-select') as HTMLSelectElement

const adduserName = document.querySelector('input.adduser-name') as HTMLInputElement
const adduserNamePop = document.querySelector('div.adduser-name-popup') as HTMLDivElement

export class MyAccountView {
    constructor(
        public dom: HTMLDivElement = document.querySelector('div.account') as HTMLDivElement
    ) {
        this.listen()
    }

    listen() {
        this.nameListener()
        this.emailListener()
        this.passwordListener()
        this.passwordConfirmListener()
        this.updateButtonListener()
    }

    nameListener() {
        let timeoutID: any
        const showError = (error: string) => {
            nameInputPopup.innerHTML = error
            nameInput.classList.add('error')
            nameInputPopup.classList.add('active')
        }
        const hideError = () => {
            nameInputPopup.classList.remove('active')
            nameInput.classList.remove('error')
            nameInputPopup.innerHTML = ''
        }
        const handler = (event: Event) => {
            const input: HTMLInputElement = event.currentTarget as HTMLInputElement
            clearTimeout(timeoutID)
            timeoutID = setTimeout(() => {
                if (!input.value) {
                    hideError()
                    return
                }

                const result = name.validate(input.value)
                if (result.error) {
                    showError(result.error.message)
                    return
                }

                hideError()

            }, 750)
        }
        nameInput.addEventListener('input', handler)
    }

    emailListener() {
        const showError = (error: string) => {
            emailInput.classList.add('error')
            emailInputPopup.innerHTML = error
            emailInputPopup.classList.add('active')
        }
        const hideError = () => {
            emailInput.classList.remove('error')
            emailInputPopup.innerHTML = ''
            emailInputPopup.classList.remove('active')
        }
        let timeoutID: any
        const handler = (event: Event) => {
            clearTimeout(timeoutID)
            const input = event.currentTarget as HTMLInputElement
            timeoutID = setTimeout(() => {
                if (!input.value) {
                    hideError()
                    return
                }   
                const result = email.validate(input.value)
                if (result.error) {
                    showError(result.error.message)
                    return
                }
                hideError()
            }, 750)

        }

        emailInput.addEventListener('input', handler)
    }

    passwordListener() {
        let timeoutID: any

        function showError(error: string) {
            passwordInput.classList.add('error')
            passwordInputPopup.innerHTML = error
            passwordInputPopup.classList.add('active')
        }

        function hideError() {
            passwordInput.classList.remove('error')
            passwordInputPopup.innerHTML = ''
            passwordInputPopup.classList.remove('active')
        }

        const showConfirmError = (error: string) => {
            passwordConfirmInput.classList.add('error')
            passwordConfirmInputPopup.innerHTML = error
            passwordConfirmInputPopup.classList.add('active')
        }

        const hideConfirmError = () => {
            passwordConfirmInput.classList.remove('error')
            passwordConfirmInputPopup.classList.remove('active')
            passwordConfirmInputPopup.innerHTML = ''
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

                if (passwordConfirmInput.value && (passwordConfirmInput.value !== input.value)) {
                    if (!passwordConfirmInput.classList.contains('error')) {
                        showConfirmError('Passwords must match!')
                    }
                }

                if (passwordConfirmInput.value && passwordConfirmInput.value === input.value) {
                    hideConfirmError()
                }

            }, 750)
        }

        passwordInput.addEventListener('input', handler)
    }

    passwordConfirmListener() {

        const showError = (error: string) => {
            passwordConfirmInput.classList.add('error')
            passwordConfirmInputPopup.innerHTML = error
            passwordConfirmInputPopup.classList.add('active')
        }

        const hideError = () => {
            passwordConfirmInput.classList.remove('error')
            passwordConfirmInputPopup.innerHTML = ''
            passwordConfirmInputPopup.classList.remove('active')
        }

        const hidePasswordError = () => {
            passwordInput.classList.remove('error')
            passwordInputPopup.classList.remove('active')
            passwordInputPopup.innerHTML = ''
        }

        const showPasswordError = (error: string) => {
            passwordInput.classList.add('error')
            passwordInputPopup.innerHTML = error
            passwordInputPopup.classList.add('active')
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

                if (passwordInput.value === '') {
                    showPasswordError('You must enter a password first')
                }

                const result = password.validate(input.value)

                if (result.error) {
                    showError(result.error.message)
                    return
                }

                if (input.value !== passwordInput.value) {
                    showError('Passwords must match!')
                    return
                }

                hideError()

            }, 750)
        }

        passwordConfirmInput.addEventListener('input', handler)
    }

    updateButtonListener() {

        const handler = async (event: Event): Promise<void> => {
            let error
            document.querySelectorAll('input').forEach(input => {
                if (input.classList.contains('error')) {
                    input.focus()
                    error = true
                }
            })

            if (error) {
                return
            }

            const updateObj = {
                name: nameInput.value,
                email: emailInput.value,
                password: passwordInput.value,
                confirm: passwordConfirmInput.value
            }

            const update = await fetch('/db/update/account', {
                method: 'POST',
                headers: new Headers([['Content-Type', 'application/json']]),
                body: JSON.stringify(updateObj)
            })

            if (!update.ok) {
                console.log(update.statusText)
            }

            const response = await update.json()

            const responseError = () => {
                updateResultStatus.innerHTML = response.message
                updateResultStatus.classList.add('error')
            }

            const responseSuccess = () => {
                updateResultStatus.innerHTML = response.message
                updateResultStatus.classList.add('success')
            }

            if (response.error) {
                responseError()
            } else {
                responseSuccess()
            }

            setTimeout(() => {
                updateResultStatus.classList.remove('error', 'success')
                updateResultStatus.innerHTML = ''
            }, 3500)
        }

        updateButton.addEventListener('click', handler)
    }

    show() { this.dom.classList.add('active') }
    hide() { this.dom.classList.remove('active') }
}