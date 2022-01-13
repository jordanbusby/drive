export let 

    htmlElement = document.getElementsByTagName('html')[0] as HTMLHtmlElement,

    /** TOP / ACCOUNT */
    topHeader = document.querySelector('.top#header') as HTMLDivElement,
    topAccountContainer = document.querySelector('.top#account-container') as HTMLDivElement,
    topAccountName = document.querySelector('.top#account-name') as HTMLDivElement,

    mainDiv = document.getElementById('main') as HTMLDivElement,
    filesHeader = document.querySelector("#files-header") as HTMLDivElement,
    navContainer = document.getElementById("navigation-container") as HTMLDivElement,
    filesContainer = document.getElementById("files-container") as HTMLDivElement,

    /** CONTROLS  */
    deleteControl = document.getElementById("control-delete") as HTMLDivElement,
    addControl = document.getElementById("control-add") as HTMLDivElement,
    controlsDiv = document.querySelector(".controls") as HTMLDivElement,
    messages = document.getElementById("messages") as HTMLDivElement,

    /** DIRECTORY PATH DIV */
    pathDiv = document.getElementById("path") as HTMLDivElement,
    pathMenu = document.getElementById("pathmenu") as HTMLDivElement,
    uploadFolderLinks = document.querySelectorAll(".uploadfolder-link") as NodeListOf<HTMLDivElement>,

    /** PATH MENU */
    pathmenuUploadFile = document.getElementById("pathmenu-uploadfile") as HTMLDivElement,
    pathDownArrow = document.getElementById("path_down_arrow") as HTMLImageElement,

    /** FOLDER MENU */
    folderMenu = document.querySelector(".folder_menu") as HTMLDivElement,
    folderMenuDelete = document.getElementById("foldermenu-delete") as HTMLDivElement,

    /** FILE MENU */
    fileMenu = document.getElementById("filemenu") as HTMLDivElement,
    fileMenuDelete = document.getElementById("filemenu-delete") as HTMLDivElement,
    newFolderEl = document.getElementById("newfolder") as HTMLDivElement,
    filemenuDownload = document.querySelector('#filemenu-download') as HTMLDivElement,
    filemenuDownloadPDF = document.querySelector('#filemenu-downloadpdf') as HTMLDivElement,

    /**  New Folder Window */
    newFolderCreate = document.querySelector("#newfolder-create") as HTMLDivElement,
    newFolderCancel = document.querySelector("#newfolder-cancel") as HTMLDivElement,
    newFolderClose = document.querySelector("#newfolder-close") as HTMLDivElement,
    newFolderText = document.querySelector("#newfolder-input") as HTMLInputElement,

    /** Rename Dialog  */
    renameDiv = document.getElementById("rename") as HTMLDivElement,
    renameConfirmButton = document.getElementById("rename-confirm-button") as HTMLDivElement,
    renameCancelButton = document.getElementById("rename-cancel-button") as HTMLDivElement,
    renameClose = document.querySelector("#close") as HTMLDivElement,
    renameText = document.getElementById("rename-input") as HTMLInputElement,

    /** INFO BOX **/
    infoBox = document.getElementById("infobox") as HTMLDivElement,
    infoBoxHeader = document.getElementById("ib-header") as HTMLDivElement,
    infoBoxTitle = document.getElementById("ib-title") as HTMLDivElement,
    infoBoxImg = document.getElementById("ib-img") as HTMLImageElement,
    infoBoxProgressFill = document.getElementById("progress-fill") as HTMLDivElement,
    infoBoxProgressPercent = document.getElementById("progress-percent") as HTMLSpanElement,

    /** FILE VIEWER */
    fileviewContainer = document.querySelector(".fileview#container") as HTMLDivElement,
    fileviewHeader = document.querySelector(".fileview#header") as HTMLDivElement,
    fileviewTitle = document.querySelector(".fileview#title") as HTMLDivElement,
    fileviewClose = document.querySelector('.fileview#close-fileviewer') as HTMLDivElement,
    fileviewFiletypeImage = document.querySelector(".fileview#filetype") as HTMLImageElement,
    fileviewTitleText = document.querySelector(".fileview#title-text") as HTMLSpanElement,

    /** DOWNLOAD: Preview Unavailable */
    downloadMain = document.querySelector(".download#main") as HTMLDivElement,
    downloadMainTitle = document.querySelector(".download#main-title") as HTMLDivElement,
    downloadMainButtonsContainer = document.querySelector(".download#main-buttons") as HTMLDivElement,
    downloadMainButtonDownload = document.querySelector(".download#buttons-download") as HTMLDivElement,
    downloadMainButtonsCancel = document.querySelector(".download#buttons-cancel") as HTMLDivElement,

    /** PREVIEW / CANVAS */

    previewViewport = document.querySelector('.preview#viewport') as HTMLDivElement,
    previewViewportFull = document.querySelector('.preview#fullsize') as HTMLDivElement,
    previewViewportThumbs = document.querySelector('.preview#thumbnails') as HTMLDivElement,

    /** PREVIEW / EXTERNAL IFRAME **/
    
    iFrameWrapper = document.querySelector('.iframe-viewer#iframe-wrapper') as HTMLDivElement,

    /** DIMMER DIV */
    dim = document.querySelector("#dim") as HTMLDivElement,

    /** ACCOUNT SETTINGS */
    accountSettingsWrapper = document.querySelector('.account-settings#wrapper') as HTMLDivElement,
    accountSettingsHeaderTitle = document.querySelector('.account-settings-header#title') as HTMLParagraphElement,
    accountSettingsHeaderClose = document.querySelector('.account-settings-header#close') as HTMLDivElement,
    accountSettingsTabs = document.querySelectorAll<HTMLDivElement>('.account-settings-footer[data-tab]') as NodeListOf<HTMLDivElement>,
    accountSettingsSections = document.querySelectorAll<HTMLDivElement>('.account-settings-body>#wrapper') as NodeListOf<HTMLDivElement>,

    /** MAIN COLLAPSIBLE MENU */
    mainMenuContainer = document.querySelector('.collapsible-menu') as HTMLDivElement;