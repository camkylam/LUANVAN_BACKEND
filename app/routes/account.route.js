const express = require('express');
const accounts = require('../controllers/account.controller');

const router = express.Router();

router.route('/')
    .post(accounts.create)
    .get(accounts.findAll)
    .delete(accounts.deleteAll)

router.route('/:id')
    .put(accounts.update)
    .get(accounts.findOne)
    .delete(accounts.deleteOne)

router.route('/login')
    .post(accounts.login)

router.route('/role')
    .post(accounts.findEmailFromRole)

router.route('/role/hamlet')
    .post(accounts.findEmailFromRoleAndHamlet)

router.route('/role/hamlet/ward')
    .post(accounts.findEmailFromRoleAndWard)
    
router.route('/role/partycell')
    .post(accounts.findEmailFromRoleAndPartyCell)

module.exports = router;

