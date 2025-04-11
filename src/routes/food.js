const express = require("express");
const router = express.Router();
const foodController = require("../controllers/foodController");

// Middleware şu an için boş olduğu için şimdilik yorum satırına alıyorum
// const authMiddleware = require("../middleware/authMiddleware");

router.get("/", foodController.getAllFoodItems);
router.post("/item", foodController.createFoodItem);
// router.post("/", authMiddleware, foodController.createFood); // Şimdilik kapalı

module.exports = router;