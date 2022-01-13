export class Loader {
    DOM: Record<string, HTMLElement>
    constructor() {
        this.DOM = this.getDOM()
    }

    getDOM() {
        return {
            loaderContainer: document.querySelector('.loader-container') as HTMLDivElement
        }
    }

    show() {
        this.DOM.loaderContainer.classList.add('active')
    }

    hide() {
        this.DOM.loaderContainer.classList.remove('active')
    }

    

}