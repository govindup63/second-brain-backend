"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = __importDefault(require("zod"));
// Validate environment variables
const envSchema = zod_1.default.object({
    JWT_PASS: zod_1.default.string(),
});
const env = envSchema.parse(process.env);
// Middleware to authenticate and attach userId
const userMiddleware = (req, res, next) => {
    const header = req.headers["authorization"];
    // Check if the authorization header is provided
    if (!header) {
        res.status(403).json({
            message: "You are not logged in! Authentication failed.",
        });
        return;
    }
    try {
        // Verify the token
        const decoded = jsonwebtoken_1.default.verify(header, env.JWT_PASS);
        // Attach the decoded user ID to the request object
        req.userId = decoded.id;
        next(); // Proceed to the next middleware or route handler
    }
    catch (error) {
        // Handle token verification errors
        res.status(403).json({
            message: "Invalid or expired token! Authentication failed.",
        });
    }
};
exports.userMiddleware = userMiddleware;
