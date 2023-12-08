const express = require('express');
const role_permissions = require('../controllers/role_permission.controller');

const router = express.Router();

router.route('/')
    .post(role_permissions.create)
    .get(role_permissions.findAll)

router.route('/:id')
    .get(role_permissions.findOne)
    .post(role_permissions.deleteOne)

module.exports = router;

