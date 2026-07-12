import express from "express";

const router =
express.Router();

import {
 getTemplates,
 createTemplate,
 deleteTemplate
}
from "../controllers/templateController";

router.get("/", getTemplates);

router.post("/", createTemplate);

router.delete(
 "/:id",
 deleteTemplate
);

export default router;