import { NextFunction, Request, RequestHandler, Response } from "express";
import { isLoggedIn } from '../api/auth'
export const verifyLoggedOut = (req: Request, res: Response, next: NextFunction) => {
    if (isLoggedIn(req)) {
        //return next(new Error('Already logged in.'));
        res.redirect('/');
    }
    next();
}

export const verifyLoggedIn = (req: Request, res: Response, next: NextFunction) => {
    
    if (!isLoggedIn(req)) {
        //return next(new Unauthorized('You must be logged in'));
        //instead of returning a JSON error, as we do with the default
        //express handler, we give them a redirect to the login page.
        //a JSON error is fine for API, but this is frontend
        res.redirect('/login');
    }
    next();
}