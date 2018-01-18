var express = require('express');
var fileTools = require("../files/files-saver.js");
var rsaTools = require("../crypto/rsa-key-gen.js");
var router = express.Router();

var base64 = require("base64-arraybuffer");
var btoa = require('btoa');
var atob = require('atob');
var serpent = require("../crypto/api/serprent.js");

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: 'Express'});
});

router.get('/test', function (req, res, next) {
    res.render('test', {title: 'Express'});
});

router.get('/login', (req, res, next) => {
    res.render('login', {title: 'Login', error: req.param('error')});
});

router.get('/all-files', function (req, res, next) {
    fileTools
        .allFiles()
        .then(function (data) {
            res.render('files', {files: data});
        });
});

router.get('/file/rest/:fileName', function (req, res, next) {
    var fileName = req.params.fileName;
    fileTools
        .read(fileName)
        .then(function (data) {
            res.send(JSON.stringify({fileName: fileName, fileContent: data}));
        });
});

router.get('/file/:fileName', function (req, res, next) {
    res.render('single-file');

});

var bufferToBase64 = function (buf) {
    var binstr = bufToStr(buf);
    return btoa(binstr);
};


function bufToStr(buf) {
    return Array.prototype.map.call(buf, function (ch) {
        return String.fromCharCode(ch);
    }).join('');
}
router.post('/rsa/key', function (req, res, next) {
    res.setHeader('Content-Type', 'application/json');
    if (req.body.key) {
        rsaTools
            .parseGenerateAndEncrypt(req.body.key)
            .then(function (result) {
                var sessionKey = result[0];
                req.session.sessionKey = result[1];
                req.session.save();
                res.send(JSON.stringify({
                    sessionKeyBase64: bufferToBase64(new Uint8Array(sessionKey))
                }))
            })
            .catch(function (err) {
                console.warn(err);
                res.send(JSON.stringify({error: "ERROR!"}))
            });
    }
});

router.post('/get-file', function (req, res, next) {
    var key = getKey(req);
    var fileName = req.body.fileName;
    fileTools
        .read(fileName)
        .then(function (data) {
            var file = key ? data.length ? btoa(serpent.cfb.encrypt(data.toString(), key)) : "" : "";
            res.send({file: file, keyExpired: key.length === 0});
        });
});

router.post('/save-file', function (req, res, next) {
    var key = getKey(req);
    var fileName = req.body.fileName;
    var fileContent = req.body.fileContent;
    fileTools.write(fileName, serpent.cfb.decrypt(atob(fileContent), key))
        .then(function (data) {
            res.send("Success!!!");
        });
});

router.post('/create-file', function (req, res) {
    var fileName = req.body.fileName;
    fileTools.write(fileName, "")
        .then(function (data) {
            res.send("Success!!")
        })
});

function getKey(req) {
    return rsaTools.getSessionKey(req.session.sessionKey);
}

const keys = require('../keys/keys.json');

router.post('/login/password', (req, res) => {
    let password = req.body.password;
    if (password === keys.password) {
        req.session.passwordValid = true;
        res.redirect('/all-files');
    } else {
        res.redirect('/login?error=true');
    }
});

module.exports = router;
