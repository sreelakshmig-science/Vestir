const express = require("express")
const favouriteModel = require("../models/Favourite.js")
const auth = require("../middleware/Auth.js")

const router = express.Router()


// ADD FAVOURITE
router.post("/favourites", auth, async (req, res) => {

    const favourite = new favouriteModel({
        user: req.user.id,
        dress: req.body.dress
    })

    await favourite.save()

    res.status(200).send("Dress added to favourites!")
})


// GET MY FAVOURITES
router.get("/favourites", auth, async (req, res) => {

    const favourites = await favouriteModel.find({
        user: req.user.id
    }).populate("dress")

    res.send(favourites)
})


// REMOVE FAVOURITE
router.delete("/favourites/:id", auth, async (req, res) => {

    const favourite = await favouriteModel.findOneAndDelete({
        _id: req.params.id,
        user: req.user.id
    })

    if (favourite) {
        res.send("Favourite removed!")
    }
    else {
        res.status(404).send("Favourite not found!")
    }
})


module.exports = router