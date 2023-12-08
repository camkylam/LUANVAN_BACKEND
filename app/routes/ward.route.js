const express = require("express");
const ward = require("../controllers/ward.controller");

const router = express.Router();

router.route("/").post(ward.create).get(ward.findAll).delete(ward.deleteAll);

router.route("/:id").put(ward.update).get(ward.findOne).delete(ward.deleteOne);
router.route("/dep/:depId").get(ward.findAllWardOfADep);

router.route('/ward/name')
  .post(ward.findWardIdByName)
module.exports = router;