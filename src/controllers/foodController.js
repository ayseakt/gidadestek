const Food = require("../models/Food");
const FoodItem = require("../models/FoodItem");

exports.getAllFoodItems = async (req, res) => {
  try {
    const items = await FoodItem.findAll();
    res.status(200).json(items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Bir şeyler ters gitti." });
  }
};

exports.createFoodItem = async (req, res) => {
  try {
    const item = await FoodItem.create(req.body);
    res.status(201).json(item);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: "Ürün eklenemedi." });
  }
};

exports.createFood = async (req, res) => {
  try {
    const newFood = await Food.create(req.body);
    res.status(201).json(newFood);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gıda eklenemedi" });
  }
};