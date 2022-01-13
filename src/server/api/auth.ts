import { Request, Response } from 'express';
import { SESSION_NAME } from '../config';
import { User, UserDocument, UserDocumentToJSONInterface } from '../models'

export const isLoggedIn = (req: Request) => {
    return !!req.session.user;
}
export const logIn = (req: Request, res:Response, user: UserDocument) => {
    req.session.user = user;
}

const destroySession = (req: Request, res: Response): Promise<Error|string> => {
    return new Promise( (resolve, reject) => {
        req.session.destroy( err => {
            if (err) reject(err)
            res.clearCookie(SESSION_NAME as string)
            resolve('Success')
        })
    })
}

export const logOut = async (req: Request, res: Response): Promise<string|Error> => {
    const doc = await User.findOneAndUpdate({ email: req.session.user.email }, { loggedIn: false }, {new: true})
    let message

    try {
        message = await destroySession(req, res)//throws on reject
    }

    catch(e) {
        return e
    }
    
    return message
}