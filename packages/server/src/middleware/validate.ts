import { z, ZodSchema } from "zod";
import { Request, Response, NextFunction } from "express";

export function validate<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res
        .status(400)
        .json({ error: result.error.errors[0]?.message ?? "Validation error" });
      return;
    }
    req.body = result.data;
    next();
  };
}
