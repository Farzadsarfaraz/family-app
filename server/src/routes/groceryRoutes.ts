import { Router } from "express";
import {
  clearCompletedGroceries,
  createGrocery,
  deleteGrocery,
  listGroceries,
  updateGrocery,
} from "../controllers/groceryController";

const router = Router();

router.get("/", listGroceries);
router.post("/", createGrocery);
router.patch("/:id", updateGrocery);
router.delete("/:id", deleteGrocery);
router.delete("/", clearCompletedGroceries);

export default router;
