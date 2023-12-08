const express = require("express");
const district = require("../controllers/district.controller");

const router = express.Router();

router
  .route("/")
  .post(district.create)
  .get(district.findAll)
  .delete(district.deleteAll);

router
  .route("/:id")
  .put(district.update)
  .get(district.findOne)
  .delete(district.deleteOne);
router.route("/cty/:ctyId").get(district.findAllDepOfACty);

router.route('/district/name')
    .post(district.findDistrictIdByName)
module.exports = router;