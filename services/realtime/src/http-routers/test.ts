import express from "express";
import { generateTestJWT } from "../http-handlers/generate-test-jwt";

export const router = express.Router();

router.get("/jwt", generateTestJWT);
