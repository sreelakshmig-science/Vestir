const mongoose = require('mongoose');

const favouriteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    dress: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Dress',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent the same user from favouriting the same dress twice
favouriteSchema.index(
  { user: 1, dress: 1 },
  { unique: true }
);

module.exports = mongoose.model('Favourite', favouriteSchema);