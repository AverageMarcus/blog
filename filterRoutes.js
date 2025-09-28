const express = require('express');
const router = express.Router();
const blackHole = function (req, res) {
    res.redirect("https://crawler-test.com/redirects/infinite_redirect");
};

// Specifically allow, but mark as not-found, any `/.well-known/` paths
router.all(/^\/\.well-known\//, function(req, res) {
    res.sendStatus(404);
});

// Block access to any root-level dot files
router.all(/^\/\./, blackHole);
// Block access to file types I don't use
router.all(/.*\.php$/, blackHole);
router.all(/.*\.asp$/, blackHole);
router.all(/.*\.aspx$/, blackHole);
router.all(/.*\.gz$/, blackHole);
router.all(/.*\.bz2$/, blackHole);
router.all(/.*\.tar$/, blackHole);
router.all(/.*\.sql$/, blackHole);
router.all(/.*\.env$/, blackHole);
router.all(/.*\.ini$/, blackHole);
router.all(/.*\.pem$/, blackHole);
router.all(/.*\.key$/, blackHole);
router.all(/.*\.crt$/, blackHole);
router.all(/.*\.properties$/, blackHole);
// Block access to any .git folders
router.all(/.*\/\.git\/.*/, blackHole);
// Block attempts to navigate up directories
router.all(/.*\.\.\/.*/, blackHole);
// Block access to special Mac folder
router.all('/__MACOSX/*?', blackHole);
// Block access to Workdpress files
router.all('(/*)?/wp-admin/', blackHole);
router.all('(/*)?/wp-admin/.*', blackHole);
router.all('(/*)?/wp-includes/?(*)?', blackHole);
router.all('(/*)?/wp-content/?(*)?', blackHole);
router.all('/wordpress/', blackHole);
router.all('/wp(2)?/', blackHole);
// Block access to possible databases
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
// Block access to possible backups and uploads
router.all('/backup/', blackHole);
router.all('/uploads/', blackHole);
router.all('/test/', blackHole);
router.all('/temp/', blackHole);
router.all(/.*\/dbbackup\/.*/, blackHole);
router.all('/bak/', blackHole);
router.all('archive.zip', blackHole);
// Block access to possible credentials
router.all('/env.test', blackHole);
router.all('(/.*)?/env$', blackHole);
router.all('/admin(/.*)?', blackHole)
router.all('/credentials(/*)?', blackHole);
router.all(/.*credentials\.json$/, blackHole);
router.all(/.*keys\.json$/, blackHole);
router.all(/.*secrets\.json$/, blackHole);
// Block system paths
router.all('/etc/*', blackHole);
router.all('/var/*', blackHole);
router.all('/usr/*', blackHole);
router.all('/user/*', blackHole);

// Block misc stuff
router.all('/data/owncloud.log', blackHole);
router.all('/autodiscover/autodiscover.xml', blackHole)
router.all('/.well-known/autoconfig(/*)?', blackHole)
router.all('/sites/default/files/', blackHole);
router.all(/.*\/mail\/config-.+\.xml/, blackHole);
router.all('/bitnami/*', blackHole)
router.all('/aws/*', blackHole)

// Block methods I don't support
router.post('*', blackHole);
router.put('*', blackHole);
router.delete('*', blackHole);


module.exports = router
