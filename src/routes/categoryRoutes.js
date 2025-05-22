const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/CategoryController');
const authMiddleware = require('../middleware/authMiddleware');

// Auth gerekmeyen public rotalar
router.get('/', categoryController.getAllCategories);

// Auth gereken rotalar
router.use(authMiddleware);

// router.post('/', adminMiddleware, categoryController.createCategory);
// router.put('/:id', adminMiddleware, categoryController.updateCategory);
// router.delete('/:id', adminMiddleware, categoryController.deleteCategory);

module.exports = router;