const mongoose = require("mongoose")

const favouriteSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    },
    dress: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "dress"
    }
})

const favouriteModel = mongoose.model("favourite", favouriteSchema)

module.exports = favouriteModel