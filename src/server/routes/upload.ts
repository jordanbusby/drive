import { Router, json } from 'express';
import { uploadInit, uploadHandler } from '../api/uploadFunction'
import { file, compare } from '../api'

const router = Router()

router.post('/initupload', json(), uploadInit)

router.post('/uploadchunk', uploadHandler)

router.post('/newcompare', async (req, res) => {
  const { files, directory } = req.body
  const result = await compare(files, directory)
  res.json(result)
})

export default router
