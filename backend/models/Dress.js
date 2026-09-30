// Dress model: clothing items that can be tried on and favourited.

const mongoose = require('mongoose');

const dressSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    size: { type: String, required: true, uppercase: true, trim: true },
    image: { type: String, required: true },
    uploader: { type: String, required: true, trim: true },
    description: { type: String, default: 'No description provided.' },
  },
  { timestamps: true }
);

// Serialize: "_id" -> "id", drop "__v".
dressSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Dress', dressSchema);