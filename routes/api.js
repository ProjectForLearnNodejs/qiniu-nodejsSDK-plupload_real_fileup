/**
 * API ÇëÇóÂ·ÓÉ
 * @type {exports}
 */
var express = require('express');
var router = express.Router();
var fileupload = require('./fileupload/fileupload');

router.use('/fileupload', fileupload);

module.exports = router;