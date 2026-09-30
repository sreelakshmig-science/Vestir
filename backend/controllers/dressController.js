const Dress = require('../models/Dress');
const cloudinary = require('../config/cloudinary');

// Get all dresses
exports.getDresses = async (req, res) => {
  try {
    const dresses = await Dress.find()
      .sort({ createdAt: -1 });

    res.json(dresses);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Add a new dress
exports.addDress = async (req, res) => {
  try {
    const { name, size, description } = req.body;

    // Check if an image was uploaded
    if (!req.file) {
      return res.status(400).json({
        message: 'Image upload is required',
      });
    }

    // Upload image to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'vestir_dresses',
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      uploadStream.end(req.file.buffer);
    });

    // Save dress information in MongoDB
    const dress = await Dress.create({
      name,
      size,
      description,
      imageUrl: result.secure_url,
      uploadedBy: req.user.id,
    });

    res.status(201).json(dress);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};