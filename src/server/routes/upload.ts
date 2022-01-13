import { Router, json } from 'express';
import fs from 'fs/promises'
import { uploadInit, uploadHandler } from '../api/uploadFunction'
import { file } from '../api'
import { compare } from '../api'

const router = Router();

router.post('/initupload', json(), uploadInit);
router.post('/uploadchunk', uploadHandler);

router.post('/compare', async (req, res) => {
    const { files, directory } = req.body

    const results = await file.compareFiles(files, directory)

    res.json(results)
})

router.post('/newcompare', async (req, res) => {
    const { files, directory } = req.body
    const result = await compare(files, directory)
    res.json(result)
})

export default router;