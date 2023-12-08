const express = require('express');
const permissions = require('../controllers/permission.controller');

const router = express.Router();

router.route('/')
    .post(permissions.create)
    .get(permissions.findAll)
    .delete(permissions.deleteAll)

router.route('/:id')
    .put(permissions.update)
    .get(permissions.findOne)
    .delete(permissions.deleteOne)

module.exports = router;

