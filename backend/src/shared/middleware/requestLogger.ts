import { Request, Response, NextFunction } from "express";
import { logger } from "../logger/logger";


export const requestLogger =(
    req : Request,
    res : Response,
    next : NextFunction
) =>{
    logger.info({
        method : req.method,
        url : req.url
    })

    next()
}