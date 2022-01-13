import { Drive } from './drive'
import * as Joi from 'joi'

const name = Joi.string().min(3).max(128).trim().pattern(/^\w+\s\w+$/).rule({message: `'First Last' format required.`})
const email = Joi.string().min(6).max(128).lowercase().trim().pattern(/^\w+@\w+[.]{1}\w+/).rule({ message: `'MyAddress@MyEmail.xyz' format required.`})
const password = Joi.string().min(4).max(72).trim()

const domWrapper = document.querySelector('div.my_account--wrapper') as HTMLDivElement
const nameInput = document.querySelector('.my_account_input--name') as HTMLInputElement
const emailInput = document.querySelector('.my_account_input--email') as HTMLInputElement
const passwordInput = document.querySelector('.my_account_input--password') as HTMLInputElement
const confirmInput = document.querySelector('.my_account_input--confirm') as HTMLInputElement

const namePopup = document.querySelector('.my_account_popup--name') as HTMLParagraphElement
const emailPopup = document.querySelector('.my_account_popup--email') as HTMLParagraphElement
const passwordPopup = document.querySelector('.my_account_popup--password') as HTMLParagraphElement
const confirmPopup = document.querySelector('.my_account_popup--confirm') as HTMLParagraphElement

const updateButton = document.querySelector('.my_account_body--submit') as HTMLDivElement
const updateResult = document.querySelector('.my_account_body--result') as HTMLDivElement



export class MyAccount {
    public Drive!: Drive
    public DOM = { wrapper: domWrapper }

    constructor(drive: Drive) {
        this.Drive = drive
        this.addEventListeners()
    }

    show() {
        this.DOM.wrapper.classList.add('active')
    }

    hide() {
        this.DOM.wrapper.classList.remove('active')
    }

    nameListener() {
        let timeoutID: any
        const showError = (error: string) => {
            namePopup.innerHTML = error
            nameInput.classList.add('error')
            namePopup.classList.add('active')
        }
        const hideError = () => {
            namePopup.classList.remove('active')
            nameInput.classList.remove('error')
            namePopup.innerHTML = ''
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
            emailPopup.innerHTML = error
            emailPopup.classList.add('active')
        }
        const hideError = () => {
            emailInput.classList.remove('error')
            emailPopup.innerHTML = ''
            emailPopup.classList.remove('active')
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
            passwordPopup.innerHTML = error
            passwordPopup.classList.add('active')
        }

        function hideError() {
            passwordInput.classList.remove('error')
            passwordPopup.innerHTML = ''
            passwordPopup.classList.remove('active')
        }

        const showConfirmError = (error: string) => {
            confirmInput.classList.add('error')
            confirmPopup.innerHTML = error
            confirmPopup.classList.add('active')
        }

        const hideConfirmError = () => {
            confirmInput.classList.remove('error')
            confirmPopup.classList.remove('active')
            confirmPopup.innerHTML = ''
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

                if (confirmInput.value && (confirmInput.value !== input.value)) {
                    if (!confirmInput.classList.contains('error')) {
                        showConfirmError('Passwords must match!')
                    }
                }
                
                if (input.value && !confirmInput.value) {
                    showConfirmError('Passwords must match!')
                }

                if (confirmInput.value && confirmInput.value === input.value) {
                    hideConfirmError()
                }

            }, 750)
        }

        passwordInput.addEventListener('input', handler)
    }

    passwordConfirmListener() {

        const showError = (error: string) => {
            confirmInput.classList.add('error')
            confirmPopup.innerHTML = error
            confirmPopup.classList.add('active')
        }

        const hideError = () => {
            confirmInput.classList.remove('error')
            confirmPopup.innerHTML = ''
            confirmPopup.classList.remove('active')
        }

        const hidePasswordError = () => {
            passwordInput.classList.remove('error')
            passwordPopup.classList.remove('active')
            passwordPopup.innerHTML = ''
        }

        const showPasswordError = (error: string) => {
            passwordInput.classList.add('error')
            passwordPopup.innerHTML = error
            passwordPopup.classList.add('active')
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

        confirmInput.addEventListener('input', handler)
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
                confirm: confirmInput.value
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
                updateResult.innerHTML = response.message
                updateResult.classList.add('error')
            }

            const responseSuccess = () => {
                updateResult.innerHTML = response.message
                updateResult.classList.add('success')
            }

            if (response.error) {
                responseError()
            } else {
                responseSuccess()
            }

            setTimeout(() => {
                updateResult.classList.remove('error', 'success')
                updateResult.innerHTML = ''
            }, 3500)
        }

        updateButton.addEventListener('click', handler)
    }

    addEventListeners() {
        this.nameListener()
        this.emailListener()
        this.passwordListener()
        this.passwordConfirmListener()
        this.updateButtonListener()
    }

}