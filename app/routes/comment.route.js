const express = require("express");
const comment = require("../controllers/comment.controller");

const router = express.Router();

router.route("/")
  .post(comment.create)
  .put(comment.update)

router.route('/partymember/:id')
  .get(comment.findByPartymember)

router.route('/comment/:id')
  .get(comment.findById)


router.route('/:year')
  .get(comment.findByYear)

router.route('/:id')
  .delete(comment.delete)

router.route('/comment/name')
  .post(comment.findByOpinionId)
router.route('/comment/status/partycell')
  .post(comment.findByYearAndPartyCell)
router.route('/comment/status/partycell/expemtion/true/id')
  .post(comment.findByYearAndPartyCellExemptionTrue)
router.route('/comment/status/partycell/expemtion/false/id/id')
  .post(comment.findByYearAndPartyCellExemptionFalse)
router.route('/comment/status/partycell/meet/id')
  .post(comment.findByYearAndPartyCellAndMeet)

module.exports = router;