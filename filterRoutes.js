const express = require('express');
const router = express.Router();
const blackHole = function (req, res) {
    res.redirect("https://crawler-test.com/redirects/infinite_redirect");
};

router.all('(/*)?/wp-admin/', blackHole);
router.all(/.*\.php$/, blackHole);
router.all(/.*\.asp$/, blackHole);
router.all(/.*\.aspx$/, blackHole);
router.all(/.*\.gz$/, blackHole);
router.all(/.*\.bz2$/, blackHole);
router.all(/.*\.tar$/, blackHole);
router.all(/.*\.sql$/, blackHole);
router.all('(/*)?/wp-includes/?(*)?', blackHole);
router.all('/.git/*?', blackHole);
router.all('/.env', blackHole);
router.all('/autodiscover/autodiscover.xml', blackHole)
router.all('/.well-known/autoconfig(/.*)?', blackHole)
router.all('/admin(/.*)?', blackHole)
router.all('/wordpress/', blackHole);
router.all('/wp(2)?/', blackHole);
router.all('/backup/', blackHole);
router.all('/database/', blackHole);
router.all('/db/', blackHole);
router.all('/db-backup/', blackHole);
router.all('/db_backup/', blackHole);
router.all('/sql-backup/', blackHole);
router.all('/sql/', blackHole);
router.all('/pma/', blackHole);
router.all('/phpmyadmin/', blackHole);
router.all('/mysqladmin/', blackHole);
router.all('/mysql/', blackHole);
router.all('/myadmin/', blackHole);
router.all('/uploads/', blackHole);
router.all('/test/', blackHole);
router.all('/temp/', blackHole);
router.all('/credentials(/*)?', blackHole);
router.all('/.vscode(/*)?', blackHole);
router.all('/sites/default/files/', blackHole);
router.all(/.*\/dbbackup\/.*/, blackHole);
router.all('/bak/', blackHole);
router.all(/.*\/mail\/config-.+\.xml/, blackHole);
router.all('archive.zip', blackHole);
router.post('*', blackHole);
router.put('*', blackHole);
router.delete('*', blackHole);


module.exports = router
