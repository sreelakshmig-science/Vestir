const express = require("express")
const { Readable } = require("stream")

const cloudinary = require("../utils/cloudinary.js")
const upload = require("../middleware/multer.js")

const router = express.Router()

router.post("/upload", upload.single("image"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            message: "Please select an image to upload!"
        })
    }

    try {
        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder: "vestir",
                    resource_type: "image"
                },
                (error, result) => {
                    if (error) {
                        return reject(error)
                    }

                    resolve(result)
                }
            )

            Readable.from(req.file.buffer).pipe(stream)
        })

        return res.status(200).json({
            message: "Image uploaded successfully!",
            image: result.secure_url,
            public_id: result.public_id
        })
    } catch (error) {
        console.error("Cloudinary upload error:", error.message)

        return res.status(500).json({
            message: "Image upload failed!"
        })
    }
})

module.exports = router