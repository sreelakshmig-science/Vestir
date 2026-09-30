const mongoose = require('mongoose');

const dressSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    size: {
      type: String,
      required: true,
    },

    description: {
      type: String,
    },

    imageUrl: {
      type: String,
      required: true,
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Dress', dressSchema);