var express = require('express');
var fileTools = require("../files/files-saver.js");
var router = express.Router();


/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: 'Express'});
});

router.get('/test', function(req,res,next){
    res.render('test', {title: 'Express'});
});

router.get('/all-files', function (req, res, next) {
    fileTools
        .allFiles()
        .then(function (data) {
            res.render('files', {files: data});
        });
});

router.get('/file/rest/:fileName', function(req,res,next){
    var fileName = req.params.fileName;
    fileTools
        .read(fileName)
        .then(function (data) {
            res.send(JSON.stringify({fileName: fileName, fileContent: data}));
        });
});

router.get('/file/:fileName', function (req, res, next) {
    var fileName = req.params.fileName;
    fileTools
        .read(fileName)
        .then(function (data) {
            res.render('single-file', {fileName: fileName, fileContent: data});
        });
});

module.exports = router;
