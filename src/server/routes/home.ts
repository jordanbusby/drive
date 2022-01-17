import { Request, Response, Router } from 'express';
import { catchAsync, verifyLoggedIn } from '../middleware';

const {
  BASE_DIR
} = process.env;

const router = Router();

router.get('/', (req, res) => {
  if (req.session.user) {
    res.redirect('/home');
  } else {
    res.redirect('/login');
  }
});

router.get('/home', verifyLoggedIn, catchAsync(async (req: Request, res: Response) => {
  res.sendFile(`${BASE_DIR}/public/html/index.htm`);
}));

export default router;
