import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import z from "zod";

// Validate environment variables
const envSchema = z.object({
  JWT_PASS: z.string(),
});
const env = envSchema.parse(process.env);

// Middleware to authenticate and attach userId
export const userMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const header = req.headers["authorization"];

  // Check if the authorization header is provided
  if (!header) {
    res.status(403).json({
      message: "You are not logged in! Authentication failed.",
    });
    return
  }

  try {
    // Verify the token
    const decoded = jwt.verify(header, env.JWT_PASS) as { id: string };

    // Attach the decoded user ID to the request object
    req.userId = decoded.id;

    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    // Handle token verification errors
    res.status(403).json({
      message: "Invalid or expired token! Authentication failed.",
    });
  }
};
