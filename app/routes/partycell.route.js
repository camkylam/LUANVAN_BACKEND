const express = require('express');
const partycells = require('../controllers/partycell.controller');

const router = express.Router();

router.route('/')
  .post(partycells.create)
  .get(partycells.findAll)

router.route('/:id')
  .put(partycells.update)
  .get(partycells.findOne)
  .delete(partycells.deleteOne)

router.route('/partycell/name')
  .post(partycells.findIdByName)

module.exports = router;

