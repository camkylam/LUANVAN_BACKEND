const express = require('express');
const partymembers = require('../controllers/partymember.controller');

const router = express.Router();

router.route('/')
    .post(partymembers.create)
    .get(partymembers.findAll)
    .delete(partymembers.deleteAll)

router.route('/cell')
    .post(partymembers.findAllByCell)

router.route('/:id')
    .put(partymembers.update)
    .get(partymembers.findOne)
    .delete(partymembers.deleteOne)
router.route('/email/id')
    .post(partymembers.findOneFromBody)
module.exports = router;

