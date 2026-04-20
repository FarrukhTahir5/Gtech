const express = require("express");
const router = express.Router();
const addressController = require("../controllers/address.controller");
const { authenticate } = require("../middleware/authenticate");

router.get("/", authenticate, addressController.getAddresses);
router.post("/", authenticate, addressController.addAddress);
router.put("/:id", authenticate, addressController.updateAddress);
router.delete("/:id", authenticate, addressController.deleteAddress);
router.put("/:id/default", authenticate, addressController.setDefault);

module.exports = router;
