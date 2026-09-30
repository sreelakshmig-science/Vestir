const Favourite = require('../models/Favourite');

// Get user's favourites
exports.getFavourites = async (req, res) => {
  try {
    const favourites = await Favourite.find({
      user: req.user.id,
    })
      .populate('dress')
      .sort({ createdAt: -1 });

    const dresses = favourites.map((favourite) => favourite.dress);

    res.json(dresses);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Add a dress to favourites
exports.addFavourite = async (req, res) => {
  try {
    const { dressId } = req.body;

    const favourite = new Favourite({
      user: req.user.id,
      dress: dressId,
    });

    await favourite.save();

    res.status(201).json({
      message: 'Added to favourites',
    });
  } catch (error) {
    // Duplicate favourite
    if (error.code === 11000) {
      return res.status(400).json({
        message: 'Dress already in favourites',
      });
    }

    res.status(500).json({
      message: error.message,
    });
  }
};

// Remove a dress from favourites
exports.removeFavourite = async (req, res) => {
  try {
    const { dressId } = req.params;

    await Favourite.findOneAndDelete({
      user: req.user.id,
      dress: dressId,
    });

    res.json({
      message: 'Removed from favourites',
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};