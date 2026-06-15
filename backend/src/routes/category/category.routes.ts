import { Router } from "express";
import { CategoryController } from "../../controllers/category/category.controller";
import { authMiddleware } from "../../shared/middleware/authMiddleware";
import { authorize } from "../../shared/middleware/roleMiddleware";
import { Role } from "../../shared/enums/role.enum";

export function createCategoryRouter(controller: CategoryController): Router {
  const router = Router();

  router.post("/",     authMiddleware, authorize(Role.ADMIN), controller.create.bind(controller));
  router.get("/",                                             controller.getAll.bind(controller));
  router.put("/:id",   authMiddleware, authorize(Role.ADMIN), controller.update.bind(controller));
  router.delete("/:id",authMiddleware, authorize(Role.ADMIN), controller.delete.bind(controller));

  return router;
}
