const express = require("express");
const router = express.Router();
const contactController = require("../controllers/contact.controller");

router.post("/", contactController.submitContact);
router.post("/newsletter", contactController.subscribeNewsletter);

module.exports = router;
