const express = require("express");
const criterionEvaluation = require("../controllers/criterion_evaluation.controller");

const router = express.Router();

router.route("/")
  .post(criterionEvaluation.create)
  .get(criterionEvaluation.findAll)
  .delete(criterionEvaluation.deleteAll)

router.route("/:id")
  .put(criterionEvaluation.update)
  .delete(criterionEvaluation.delete)


module.exports = router;