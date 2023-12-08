const express = require("express");
const hamlet = require("../controllers/hamlet.controller");

const router = express.Router();

router.route("/")
  .post(hamlet.create)
  .get(hamlet.findAll)
  .delete(hamlet.deleteAll);

router.route("/:id")
  .put(hamlet.update)
  .get(hamlet.findOne)
  .delete(hamlet.deleteOne);

router.route("/ward/:wardId").get(hamlet.findAllHamletOfWard);

router.route('/hamlet/name')
  .post(hamlet.findHamletIdByName)

module.exports = router;