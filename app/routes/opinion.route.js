const express = require("express");
const opinion = require("../controllers/opinion.controller");

const router = express.Router();

router.route("/")
  .post(opinion.create)
  .delete(opinion.deleteAll)
  .put(opinion.update)

router.route("/partymember/:id")
  .get(opinion.findByPartymember)

router.route('/opinion/:id')
  .get(opinion.findById)

router.route("/:id")
  .delete(opinion.delete)

router.route("/opinion/recommendation")
  .post(opinion.findAllOpinionsByRecommendation)

module.exports = router;