import express from "express";
// import searchService from "../controllers/searchService.controller.js";
// import searchOG from "../controllers/searchOG.controllers.js";
import { searchMovies, searchCustomers } from "../controllers/searchService.controller.js";

const router = express.Router();

router.post("/movies/search", searchMovies);
router.post("/customers/search", searchCustomers);
// router.post("/searchOG", searchOG);  

export default router;