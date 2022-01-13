import { Router } from 'express'
const { BASE_DIR } = process.env

const router = Router()

router.get('/text', (req, res) => {
    res.sendFile(BASE_DIR + '/public/css/settings.scss')
})

export default router