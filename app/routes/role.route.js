const express = require('express');
const roles = require('../controllers/role.controller');

const router = express.Router();

router.route('/')
    .post(roles.create)
    .get(roles.findAll)
    .delete(roles.deleteAll)

router.route('/:id')
    .put(roles.update)
    .get(roles.findOne)
    .delete(roles.deleteOne)

router.route('/role/name')
    .post(roles.findRoleIdByName)

module.exports = router;

