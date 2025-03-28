import express from "express";
import { checkAuth, login, logout, signup, updateProfile, getUsers, getOneUser } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

router.put("/update-profile", protectRoute, updateProfile);

router.get("/check", protectRoute, checkAuth);
// Add the new route to fetch all users
router.get("/users", protectRoute, getUsers);

router.get("/user/:id", protectRoute,getOneUser);
export default router;
