const mongoose = require("mongoose")

const dressSchema = new mongoose.Schema({
    name: String,
    size: String,
    description: String,
    image: String    //store an image URL for now
})

const dressModel = mongoose.model("dress", dressSchema)

module.exports = dressModel