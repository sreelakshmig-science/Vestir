const express = require("express")
const dressModel = require("../models/Dress.js")

const router = express.Router()


// ADD DRESS
router.post("/dresses", async (req, res) => {

    const dress = new dressModel({
        name: req.body.name,
        size: req.body.size,
        description: req.body.description,
        image: req.body.image
    })

    await dress.save()

    res.status(200).send("Dress added successfully!")
})


// GET ALL DRESSES
router.get("/dresses", async (req, res) => {

    const dresses = await dressModel.find({})

    res.send(dresses)
})


// GET ONE DRESS
router.get("/dresses/:id", async (req, res) => {

    const dress = await dressModel.findById(req.params.id)

    if (dress) {
        res.send(dress)
    }
    else {
        res.status(404).send("Dress not found!")
    }
})


router.put("/dresses/:id", async (req, res) => {

    const dress = await dressModel.findByIdAndUpdate(
        req.params.id,
        req.body,
        { returnDocument: "after" }
    )

    if (dress) {
        res.send(dress)
    }
    else {
        res.status(404).send("Dress not found!")
    }
})


// DELETE DRESS
router.delete("/dresses/:id", async (req, res) => {

    const dress = await dressModel.findByIdAndDelete(req.params.id)

    if (dress) {
        res.send("Dress deleted successfully!")
    }
    else {
        res.status(404).send("Dress not found!")
    }
})


module.exports = router