const express = require('express');

const router = express.Router();
router.all('(/*)?/wp-admin/', function (req, res) {});
router.all(/.*\.php$/, function (req, res) {});
router.all('(/*)?/wp-includes/(*)?', function (req, res) {});
router.all('/.git/*?', function (req, res) {});
router.all('/.env', function (req, res) {});
router.post('*', function (req, res) {});
router.put('*', function (req, res) {});
router.delete('*', function (req, res) {});

module.exports = router
