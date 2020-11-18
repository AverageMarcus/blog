const express = require('express');

const router = express.Router();
router.all('(/*)?/wp-admin/', function (req, res) {});
router.all('*?/xmlrpc.php', function (req, res) {});
router.all('(/*)?/wp-includes/(*)?', function (req, res) {});
router.all('/.git/*?', function (req, res) {});
router.all('/wp-login.php', function (req, res) {});

module.exports = router
