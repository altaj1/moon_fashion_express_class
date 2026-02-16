// middleware/parseModules.ts
import { Request, Response, NextFunction } from "express";

export const parseModules = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.body.modules) {
    try {
      // If modules comes as a JSON string: '["finance","order"]'
      if (typeof req.body.modules === "string") {
        req.body.modules = JSON.parse(req.body.modules);
      }
      // If modules comes as comma separated: 'finance,order'
      if (typeof req.body.modules === "string") {
        req.body.modules = req.body.modules.split(",").map((m) => m.trim());
      }
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: { message: "Invalid modules format, must be an array" },
      });
    }
  }
  next();
};
