/* eslint-disable no-shadow */
import { Router } from 'express';
import path, { resolve } from 'path';

import { verifyLoggedIn } from '../middleware';

const {
  DRIVE_PATH = ''
} = process.env;

const router = Router();

router.get('/download/', (req, res) => {
  const { currentDir, name } = req.query;

  if (!currentDir?.length || !name) {
    res.json({ message: 'File Not Found' });
    return;
  }

  const path = `${DRIVE_PATH + currentDir}/${name}`;

  res.download(path);
});

router.get('/pdf', verifyLoggedIn, (req, res) => {

  const { currentDir, name } = req.query;

  if (!currentDir || !name) {
    return;
  }

  const path = `${DRIVE_PATH + currentDir}/${name}`;

  res.sendFile(path);
});

export default router;
