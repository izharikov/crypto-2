const crypto = require('@trust/webcrypto')
var cryptoRandomString = require('crypto-random-string');

var expirationPeriod = 60 * 3600 * 1000;

var serpent = require('./api/serprent');

var rsa_opts = {
    name: "RSA-OAEP",
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),  // 24 bit representation of 65537
    hash: {name: "SHA-1"}
};

var rsaTools = (function () {

    function str2ab(str) {
        var buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
        var bufView = new Uint16Array(buf);
        for (var i = 0, strLen = str.length; i < strLen; i++) {
            bufView[i] = str.charCodeAt(i);
        }
        return buf;
    }

    function convertPublicKey(key) {
        return crypto.subtle.importKey("jwk", key, rsa_opts, true, ["encrypt"])
            .then(function (result) {
                return result;
            });
    }

    function generateSessionKey() {
        var currentTime = new Date().getTime();
        var expirationTime = currentTime + expirationPeriod;
        var time32 = [Number.parseInt(expirationTime / Math.pow(2, 32)), expirationTime % Math.pow(2, 32), 0, 0];
        var secretKeySaveOnServer = generateRandomString(32);
        var sessionKey = serpent.convertFrom128BitToString(serpent.encode(time32, secretKeySaveOnServer))
            + generateRandomString(16);
        return [sessionKey, secretKeySaveOnServer];
    }

    function getSessionKey(key) {
        var sessionKey = key[0];
        var secretKeySaveOnServer = key[1];
        var secretOfPartOfKey = serpent.decode(serpent.splitBlock(sessionKey), secretKeySaveOnServer);
        var expTime = secretOfPartOfKey[0] * Math.pow(2, 32) + secretOfPartOfKey[1];
        if ( expTime > new Date().getTime()){
            return sessionKey;
        }
        return "";
    }


    function generateRandomString(length) {
        return cryptoRandomString(length);
    }

    function encrypt(key, str) {
        return crypto.subtle.encrypt(rsa_opts, key, str2ab(str));
    }

    return {
        convertPublicKey: convertPublicKey,
        generateRandomString: generateRandomString,
        encrypt: encrypt,
        parseGenerateAndEncrypt: function (key) {
            return Promise.all([convertPublicKey(key), generateSessionKey()])
                .then(function (result) {
                    return Promise.all([encrypt(result[0], result[1][0]), result[1]]);
                })
        },
        getSessionKey : getSessionKey
    }
})();

module.exports = rsaTools;