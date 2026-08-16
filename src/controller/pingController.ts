import { Request, Response } from "express";

export async function pingCheck(_req: Request, res: Response) {
  return res.status(200).json({
    message: "pong",
  });
}