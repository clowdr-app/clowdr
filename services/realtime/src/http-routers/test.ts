import express from "express";
import { generateTestJWKs } from "../http-handlers/generate-test-jwt";

export const router = express.Router();

router.get("/testJWK", generateTestJWKs);
