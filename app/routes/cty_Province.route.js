const express = require('express');
const ctyProvinces = require('../controllers/cty_Province.controller');

const router = express.Router();

router.route('/')
    .post(ctyProvinces.create)
    .get(ctyProvinces.findAll)
    .delete(ctyProvinces.deleteAll)

router.route('/details')
    .get(ctyProvinces.findAllInclude)

router.route('/:id')
    .put(ctyProvinces.update)
    .get(ctyProvinces.findOne)
    .delete(ctyProvinces.deleteOne)

router.route('/cty/name')
    .post(ctyProvinces.findCtyProvinceIdByName)
module.exports = router;

