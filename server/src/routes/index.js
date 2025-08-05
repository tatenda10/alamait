const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth'));
router.use('/transactions', require('./transaction'));
router.use('/students', require('./student'));
router.use('/rooms', require('./room'));
router.use('/users', require('./user'));
router.use('/coa', require('./coa'));
router.use('/payments', require('./payment'));

module.exports = router; 