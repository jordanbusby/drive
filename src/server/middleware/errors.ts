import { NextFunction, Request, Response } from "express";
import { BadRequest } from "../errors";

export function notFound (req: Request, res: Response, next: NextFunction) {
    res.status(404).json({message: 'Not Found'});
}

export function serverError (err: BadRequest, req: Request, res: Response, next: NextFunction) {
    if (!err.status) {
        console.log(`!err.status`);
        console.error(err.stack);
    }
    res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
}