"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = __importDefault(require("zod"));
const cors_1 = __importDefault(require("cors"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const mongodb_1 = require("mongodb");
const crypto_1 = __importDefault(require("crypto"));
const db_1 = require("./db");
const middleware_1 = require("./middleware");
const config_1 = require("./config");
const helper_1 = require("./helper");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
const envSchema = zod_1.default.object({
    MONGO_URL: zod_1.default.string(),
    JWT_PASS: zod_1.default.string()
});
const env = envSchema.parse(process.env);
app.post("/api/v1/signup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const requredBody = zod_1.default.object({
        username: zod_1.default.string().min(3).max(30),
        password: zod_1.default.string().min(3).max(30)
    });
    const parsedCorrectly = requredBody.safeParse(req.body);
    if (!parsedCorrectly.success) {
        res.status(411).json({
            message: "wrong format of input"
        });
        return;
    }
    const { username, password } = req.body;
    const hashedPassword = yield bcrypt_1.default.hash(password, 5);
    try {
        db_1.UserModel.create({
            username: username,
            password: hashedPassword
        });
        res.status(200).json({
            message: "you are signed in as a user"
        });
        return;
    }
    catch (e) {
        console.error('error creating user: \n' + e);
        res.status(403).json({
            message: "User Already Exists / database issue"
        });
        return;
    }
}));
app.post("/api/v1/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const requredBody = zod_1.default.object({
        username: zod_1.default.string().min(3).max(30),
        password: zod_1.default.string().min(3).max(30)
    });
    const parsedCorrectly = requredBody.safeParse(req.body);
    if (!parsedCorrectly.success) {
        res.status(401).json({
            message: "body format wrong"
        });
        return;
    }
    const { username, password } = req.body;
    const user = yield db_1.UserModel.findOne({ username });
    if (!user) {
        res.status(403).json({
            message: "user does not exist try signup first"
        });
        return;
    }
    const passwordMatched = yield bcrypt_1.default.compare(password, user.password);
    if (!passwordMatched) {
        res.status(403).json({
            message: "wrong password"
        });
        return;
    }
    const token = jsonwebtoken_1.default.sign({
        id: user._id
    }, env.JWT_PASS);
    res.json({
        token
    });
}));
app.post("/api/v1/content", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const requredBody = zod_1.default.object({
        type: zod_1.default.enum(config_1.contentType),
        link: zod_1.default.string().url(),
        title: zod_1.default.string().min(1),
        tags: zod_1.default.array(zod_1.default.string()).nonempty()
    });
    const parsedCorrectly = requredBody.safeParse(req.body);
    if (!parsedCorrectly.success) {
        res.status(401).json({
            message: "data input error format"
        });
    }
    const { type, link, title, tags } = req.body;
    const tagIds = yield (0, helper_1.tagHelper)(tags);
    try {
        yield db_1.ContentModel.create({
            title: title,
            type: type,
            link: link,
            tags: tagIds,
            userId: req.userId
        });
        res.status(200).json({
            message: "your content is added succesfully"
        });
        return;
    }
    catch (e) {
        console.error("error uploading content to db: \n" + e);
        res.status(403).json({
            message: "content upload failed try again"
        });
        return;
    }
}));
app.get("/api/v1/content", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.userId;
    try {
        // Fetch content for the user
        const content = yield db_1.ContentModel.find({ userId: user }).populate("userId", "username");
        // Transform the content's tags from DocumentArray (subdocuments) to ObjectIds
        const transformedContent = yield Promise.all(content.map((item) => __awaiter(void 0, void 0, void 0, function* () {
            // Assuming item.tags is a DocumentArray of tags (subdocuments), extract ObjectIds
            const tagIds = item.tags.map((tag) => tag._id);
            // Call your helper function to fetch tag names using ObjectIds
            const tagNames = yield (0, helper_1.getTagsByIdshelper)(tagIds);
            return Object.assign(Object.assign({}, item.toObject()), { tags: tagNames // Replace ObjectIds with tag names
             });
        })));
        // Return the transformed content
        res.json({
            content: transformedContent
        });
    }
    catch (error) {
        console.error("Error fetching content:", error);
        res.status(500).json({ error: "Failed to fetch content" });
    }
}));
app.delete("/api/v1/content", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const requredBody = zod_1.default.object({
        contentId: zod_1.default.custom((value) => {
            try {
                return mongodb_1.ObjectId.isValid(value);
            }
            catch (e) {
                return false;
            }
        })
    });
    const parsedCorrectly = requredBody.safeParse(req.body);
    if (!parsedCorrectly.success) {
        res.status(401).json({
            message: "data format wrong",
            error: parsedCorrectly.error.errors
        });
    }
    const { contentId } = req.body;
    const userId = req.userId;
    try {
        const status = yield db_1.ContentModel.deleteOne({
            _id: contentId,
            userId
        });
        res.json({
            message: `content with content id: ${contentId} deleted`,
            status
        });
    }
    catch (e) {
        console.error(e);
        res.json({
            message: "error deleting the content",
            error: e
        });
    }
}));
app.post("/api/v1/brain/share", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const requredBody = zod_1.default.object({
        status: zod_1.default.boolean()
    });
    const parsedCorrectly = requredBody.safeParse(req.body);
    if (!parsedCorrectly.success) {
        res.status(401).json({
            message: "wrong input format"
        });
    }
    const { status } = req.body;
    if (status) {
        const hash = crypto_1.default.randomBytes(16).toString('hex');
        try {
            db_1.LinkModel.create({
                hash: hash,
                userId: req.userId
            });
            res.status(200).json({
                message: "Link Created successfully",
                hash: `${hash}`
            });
            return;
        }
        catch (e) {
            console.error(e);
            res.status(403).json({
                message: "error creating link",
                error: e
            });
            return;
        }
    }
    else if (!status) {
        try {
            const status = yield db_1.LinkModel.deleteMany({
                userId: req.userId
            });
            res.json({
                message: "all links to your brain is disabled",
                status
            });
            return;
        }
        catch (e) {
            console.error(e);
            res.status(403).json({
                message: "error disabling links",
                error: e
            });
            return;
        }
    }
}));
app.get("/api/v1/brain/:shareLink", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { shareLink } = req.params;
    try {
        const userLink = yield db_1.LinkModel.findOne({
            hash: shareLink
        });
        const user = userLink === null || userLink === void 0 ? void 0 : userLink.userId;
        const content = yield db_1.ContentModel.find({ userId: user }).populate("userId", "username");
        // Transform the content's tags from DocumentArray (subdocuments) to ObjectIds
        const transformedContent = yield Promise.all(content.map((item) => __awaiter(void 0, void 0, void 0, function* () {
            // Assuming item.tags is a DocumentArray of tags (subdocuments), extract ObjectIds
            const tagIds = item.tags.map((tag) => tag._id);
            // Call your helper function to fetch tag names using ObjectIds
            const tagNames = yield (0, helper_1.getTagsByIdshelper)(tagIds);
            return Object.assign(Object.assign({}, item.toObject()), { tags: tagNames // Replace ObjectIds with tag names
             });
        })));
        // Return the transformed content
        res.json({
            content: transformedContent
        });
    }
    catch (e) {
        console.error(e);
        res.status(403).json({
            message: "you dont have access to link"
        });
    }
}));
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        yield mongoose_1.default.connect(env.MONGO_URL);
        app.listen(3000, () => {
            console.log('server running on port 3000');
        });
    });
}
main();
