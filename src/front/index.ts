import { Drive } from './components'

const drive: Drive = new Drive()
window.addEventListener('load', async () => {
  drive.start()
})

export default drive
