const express = require('express');

const {
  getFavourites,
  addFavourite,
  removeFavourite,
} = require('../controllers/favouriteController');

const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getFavourites);

router.post('/', protect, addFavourite);

router.delete('/:dressId', protect, removeFavourite);

module.exports = router;