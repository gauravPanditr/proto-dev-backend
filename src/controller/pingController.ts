import {  Response } from "express";

export async function pingCheck(res:Response) {
    return res.status(200).json({ message: 'pong' });
}