// Favourite model: a user saving a dress.
// The compound unique index { user: 1, dress: 1 } prevents the same user
// from saving the same dress more than once.

const mongoose = require('mongoose');

const favouriteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    dress: { type: mongoose.Schema.Types.ObjectId, ref: 'Dress', required: true },
  },
  { timestamps: true }
);

// One user can favourite a given dress only once.
favouriteSchema.index({ user: 1, dress: 1 }, { unique: true });

// Serialize: "_id" -> "id", drop "__v" (keep only the references and timestamps).
favouriteSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Favourite', favouriteSchema);