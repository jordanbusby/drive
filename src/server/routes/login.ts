import { logIn, logOut } from '../api/auth';
import { Request, Response, Router, urlencoded } from 'express';
import { catchAsync, verifyLoggedIn, verifyLoggedOut } from '../middleware';
import { User } from '../models';
import { loginSchema, validate } from '../validation'

const { 
    BASE_DIR
} = process.env;

const router = Router()

router.get('/login', verifyLoggedOut, (req, res) => {
    res.sendFile(BASE_DIR + '/public/html/login.html', (err) => {
        if (err) {
            console.error(err.stack);
        }
    });
});

router.post('/login', verifyLoggedOut, urlencoded({extended:false}), catchAsync(async(req: Request, res: Response) => {
    await validate(loginSchema, req.body);
    
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    
    if (!user || !(await user.passwordMatch(password))) {
        //throw new Unauthorized('Incorrect Login Information');
        return res.redirect('/login');
    }

    await user.updateOne({ lastLogin: new Date(Date.now()), loggedIn: true })

    logIn(req, res, user);
    res.redirect('/');
}));

router.post('/logout', verifyLoggedIn, catchAsync(async (req: Request, res: Response) => {

    const response = {
            action: 'logout',
            error: false,
            message: ''
        };

    let logout;
    try {
        logout = await logOut(req, res);
    }
    catch (e) {
        logout = e;
    }

    response.message = logout;
    res.json(response);
}));

export default router;