const express = require('express');
const router = express.Router();
const blackHole = function (req, res) {};

router.all('(/*)?/wp-admin/', blackHole);
router.all(/.*\.php$/, blackHole);
router.all(/.*\.aspx$/, blackHole);
router.all('(/*)?/wp-includes/(*)?', blackHole);
router.all('/.git/*?', blackHole);
router.all('/.env', blackHole);
router.all('/autodiscover/autodiscover.xml', blackHole)
router.all('/.well-known/autoconfig(/.*)?', blackHole)
router.all('/admin(/.*)?', blackHole)
router.all('/wordpress/', blackHole);
router.all('/wp(2)?/', blackHole);
router.all('/backup/', blackHole);
router.all('/bak/', blackHole);
router.post('*', blackHole);
router.put('*', blackHole);
router.delete('*', blackHole);


module.exports = router
