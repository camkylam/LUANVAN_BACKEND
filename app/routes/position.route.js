const express = require('express');
const positions = require('../controllers/position.controller');

const router = express.Router();

router.route('/')
    .post(positions.create)
    .get(positions.findAll)
    .delete(positions.deleteAll)

router.route('/:id')
    .get(positions.findOne)
    .delete(positions.deleteOne)

router.route('/position/name')
    .post(positions.findIdByName)

module.exports = router;

