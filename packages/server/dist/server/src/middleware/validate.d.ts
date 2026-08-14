import { ZodSchema } from "zod";
import { Request, Response, NextFunction } from "express";
export declare function validate<T>(schema: ZodSchema<T>): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=validate.d.ts.map