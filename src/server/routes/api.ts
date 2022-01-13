/* eslint-disable prefer-const */
/* eslint-disable no-shadow */
/* eslint-disable no-plusplus */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-continue */
import {
  json, Request, Response, Router
} from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { APIResponse, ReadDirectoryResponse, SelectedFile } from '../server.types';
import { APP_CONFIG } from '../config'
import { catchAsync, verifyLoggedIn } from '../middleware';
import { deleteSync } from '../api'

const { DRIVE_PATH } = APP_CONFIG;
const months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const router = Router();

router.use(verifyLoggedIn);

router.use(json());

const buildDir = async (dir: string): Promise<ReadDirectoryResponse> => {
  const result: ReadDirectoryResponse = { files: [], folders: [] };

  let files;

  try {
    files = await fs.promises.readdir(dir);
  } catch (err) {
    result.error = true;
    return result;
  }

  if (!files) {
    result.error = true;
  }

  for (const file of files) {
    if (file.indexOf('DS_Store') > 0) {
      continue;
    }

    const fileStats = await fs.promises.stat(`${dir}/${file}`);
    const step = ['B', 'KB', 'MB', 'GB', 'TB'];

    let sizeStr = '';
    let { size } = fileStats;
    let i = 0;

    while (size > 0.9) {
      if (i > 1) {
        sizeStr = size.toFixed(1) + step[i];
      } else {
        sizeStr = Math.round(size) + step[i];
      }
      size /= 1024;
      i++;
    }

    if (fileStats.isDirectory()) {
      result.folders.push({
        name: file,
        created: fileStats.mtime,
        size: sizeStr
      });
    } else {
      result.files.push({
        name: file,
        created: fileStats.mtime,
        size: sizeStr,
        type: /^.*([.].*)$/.exec(file) ? (/^.*([.].*)$/.exec(file) as RegExpExecArray)[1].slice(1) : 'unknown'
      });
    }
  }

  return result;
}

const storageSingle = multer.diskStorage({

  destination: (req, file, cb) => {
    const { currentDir } = req.body;

    cb(null, DRIVE_PATH + currentDir);
  },

  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const uploadSingle = multer({ storage: storageSingle });

const storageFolder = multer.diskStorage({

  destination: (req, file, cb) => {
    const { currentDir } = req.body;

    const mkdirPath = `${DRIVE_PATH + currentDir}/${req.body[file.originalname]}`;

    try {
      fs.mkdirSync(mkdirPath, { recursive: true, mode: 0o770 });
    } catch (e) {
      console.log(e);
    }

    cb(null, mkdirPath);
  },

  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }

});

router.post('/upload', uploadSingle.single('fileInput'), (req, res) => {
  res.status(200).json({ message: 'Upload received' });
});

router.get('/info/user', catchAsync(async (req: Request, res: Response) => {
  // toJSON is called
  res.json(req.session.user);
}));

router.post('/dir', async (req, res) => {
  const { dir } = req.body;
  const path = `${DRIVE_PATH}/${dir}`;
  const result = await buildDir(path);

  res.json(result);
});

router.post('/move', async (req, res) => {
  let { to, state } = req.body;
  const { currentDir, selectedFiles } = state;
  const baseDir = DRIVE_PATH + currentDir;
  let files: string[] = [];
  let folders: string[] = [];
  const result: APIResponse = {
    fileResults: [], folderResults: [], from: currentDir, to, error: false, message: 'Success', action: 'mv'
  };

  to = `${baseDir}/${to}/`;

  selectedFiles.forEach((file: SelectedFile) => {
    if (file.type === 'folder') {
      folders.push(file.name);
    } else {
      files.push(file.name);
    }
  });

  if (folders.length > 0) {
    folders = folders.map((folder) => baseDir + path.sep + folder);
    result.folderResults = await Promise.all(folders.map((folder) => fs.promises.rename(folder, to + folder.split('/').pop()).then(
      () => ({ error: false, folder, message: `Moved ${folder.split('/').pop()} successfully.` }),
      (reason) => ({ error: true, folder, message: reason })
    )));
  }

  if (files.length > 0) {
    files = files.map((file) => baseDir + path.sep + file);
    console.log(files);
    result.fileResults = await Promise.all(files.map((file) => fs.promises.rename(file, to + file.split('/').pop()).then(
      () => ({ error: false, file, message: `Moved ${file.split('/').pop()} successfully.` }),
      (reason) => ({ error: true, file, message: reason })
    )));
  }

  res.json(result);
});

router.post('/delete', async (req, res) => {
  const { selectedFiles, currentDir } = req.body;
  const result: APIResponse = {
    fileResults: [], folderResults: [], from: currentDir, to: '', error: false, message: '', action: 'del'
  };
  let files: string[] = [];
  let folders: string[] = [];

  selectedFiles.forEach((file: SelectedFile) => {
    file.type === 'file' ? files.push(file.name) : folders.push(file.name);
  });

  if (files.length > 0) {
    files = files.map((file) => DRIVE_PATH + currentDir + path.sep + file);
    result.fileResults = await Promise.all(files.map((file) => fs.promises.unlink(file).then(
      () => ({ error: false, file: (file.split('/').pop() as string), message: 'Deleted successfully.' }),
      (reason) => ({ error: true, file: (file.split('/').pop() as string), message: reason })
    )));
  }

  if (folders.length > 0) {
    folders = folders.map((folder) => DRIVE_PATH + currentDir + path.sep + folder);
    result.folderResults = await Promise.all(folders.map((folder) => fs.promises.rm(folder, { retryDelay: 600, maxRetries: 2, recursive: true }).then(
      () => ({ error: false, folder: (folder.split('/').pop() as string), message: 'Deleted successfully.' }),
      (reason) => ({ error: true, folder: (folder.split('/').pop() as string), message: reason })
    )));
  }

  res.json(result);
});

router.post('/dir/create', (req, res) => {
  const { currentDir, newFolderName } = req.body;
  const newPath = `${DRIVE_PATH + currentDir}/${newFolderName}`;
  const result: APIResponse = {
    action: 'mkdir', error: false, message: '', fileResults: [], folderResults: [], from: currentDir, to: newPath
  };

  if (fs.existsSync(newPath)) {
    result.error = true;
    result.action = 'mkdir';
    result.message = 'Folder already exists.';

    return res.json(result);
  }

  try {
    fs.mkdirSync(newPath, { recursive: true, mode: 0o770 });
  } catch (e) {
    console.error(e);
    result.error = true;
    result.message = e;
    return res.json({ error: true, message: e, });
  }

  result.message = `Successfully created folder at ${newPath.split('/').slice(5).join('/')}`;

  return res.json(result);
});

router.post('/rename', (req, res) => {
  const {
    currentDir, type, from, to
  } = req.body;
  const response = Object.create({});

  const basePath = `${DRIVE_PATH + currentDir}/`;

  response.from = from;
  response.to = to;
  response.action = 'rename';
  response.type = type;

  console.log(`From: ${basePath + from}`);
  console.log(`To: ${basePath + to}`);

  try {
    fs.renameSync(basePath + from, basePath + to);
  } catch (e) {
    response.error = true;
    response.message = e;
    return res.json(response);
  }
  response.error = false;
  response.message = `Successfully renamed ${from} to ${to}`;
  return res.json(response);
})

router.post('/deletesync', async (req, res) => {
  res.json(
    await deleteSync(req.body.files, req.body.directory)
  )
})

export default router;
