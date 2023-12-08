const express = require("express");
const recommendation = require("../controllers/recommendation.controller");

const router = express.Router();

router.route("/")
  .post(recommendation.create)
  .put(recommendation.update);

router.route("/ward/")
  .post(recommendation.findAllByStatus)

router.route('/recommendation/:id')
  .get(recommendation.findById)

router.route("/:id/")
  .get(recommendation.findOneByPartymember)
router.route("/:id/all")
  .get(recommendation.findAllByPartymember);
router.route("/recommendation/partymember/id")
 .post(recommendation.findPartyMembersWithoutRecommendationByPartyCell);

router.route("/recommendation/status/partycell/id")
  .post(recommendation.findAllByStatusWithPartycell);
  
module.exports = router;