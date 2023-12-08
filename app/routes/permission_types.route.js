const express = require("express");
const permissionTypes = require("../controllers/permission_types.controller");

const router = express.Router();

router.route("/").post(permissionTypes.create).get(permissionTypes.findAll);

router
  .route("/:id")
  .put(permissionTypes.update)
  .get(permissionTypes.findOne)
  .delete(permissionTypes.deleteOne);

module.exports = router;
