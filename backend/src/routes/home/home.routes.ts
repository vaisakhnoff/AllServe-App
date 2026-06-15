import { Router } from "express";
import { HomeController } from "../../controllers/home/home.controller";

export function createHomeRouter(controller: HomeController): Router {
  const router = Router();
  router.get("/", controller.getHome.bind(controller));
  return router;
}
