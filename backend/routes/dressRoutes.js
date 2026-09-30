const express = require('express');
const {
  getDresses,
  addDress,
} = require('../controllers/dressController');

const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.get('/', getDresses);

router.post(
  '/',
  protect,
  upload.single('image'),
  addDress
);

module.exports = router;