import { NextFunction, Request, RequestHandler, Response } from "express";

interface AsyncRequestHandler extends RequestHandler {
    (req: Request, res: Response, next?: NextFunction): Promise<any>
}

export const catchAsync = (handler: AsyncRequestHandler) => 
    (...args: [Request, Response, NextFunction]) => 
        handler(...args).catch(args[2]);