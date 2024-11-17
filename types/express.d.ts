import * as core from "express-serve-static-core";

declare module "express-serve-static-core" {
  interface Request {
    userId?: string; // Add userId as an optional property
  }
}
