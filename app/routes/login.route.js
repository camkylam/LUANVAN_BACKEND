const express = require('express');
const router = express.Router();
const Login = require('../controllers/login.controller');

router.route('/')
    .post(Login.login)


module.exports = router;