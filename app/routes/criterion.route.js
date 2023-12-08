const express = require("express");
const criterion = require("../controllers/criterion.controller");

const router = express.Router();

router.route("/")
  .post(criterion.create)
  .get(criterion.findAll)
  .delete(criterion.deleteAll)

router.route("/:id")
  .put(criterion.update)
  .delete(criterion.delete)

router.route("/exemption/:exemption")
  .get(criterion.findAll)

router.route("/criterion/priority/exemption")
  .get(criterion.findAllByPriority)

module.exports = router;