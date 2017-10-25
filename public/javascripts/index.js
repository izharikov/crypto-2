var isNew = false;

var rsa_opts = {
    name: "RSA-OAEP",
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),  // 24 bit representation of 65537
    hash: {name: "SHA-1"}
};

function getRSAKey() {
    var key = localStorage.getItem("rsa_key");
    if (!key) {
        isNew = true;
        return createAndSaveAKeyPair()
            .then(function (data) {
                console.log('createAndSaveAKeyPair.then', data);
                return Promise.all([exportKey(data.privateKey), exportKey(data.publicKey)]);
            })
            .then(function (result) {
                key = JSON.stringify({public: result[1], private: result[0]});
                console.log('generated key', key);
                localStorage.setItem("rsa_key", key);
                return Promise.resolve(JSON.parse(key));
            })
            .catch(function (e) {
                console.warn(e);
            })
    }
    return Promise.resolve(JSON.parse(key));
}

var keyPair;

function createAndSaveAKeyPair() {
    return window.crypto.subtle.generateKey(
        rsa_opts,
        true,   // can extract it later if we want
        ["encrypt", "decrypt"])
        .then(function (key) {
            console.log(key);
            keyPair = key;
            return key;
        });
}


function exportKey(key_object) {
    return crypto.subtle.exportKey("jwk", key_object);
}

function importKey(key_object, isPublic) {
    return crypto.subtle.importKey("jwk", key_object, rsa_opts, true, [isPublic ? "encrypt" : "decrypt"])
        .then(function (result) {
            return result;
        }, function (e) {
            console.log(e);
        });
}

function generateSessionKey() {
    var key = localStorage.getItem("session_key");
    if (key) {
        return Promise.resolve(key);
    }
    return getRSAKey()
        .then(function (key) {
            console.log('sending public RSA key: ', key.public)
            $.ajax({
                url: '/rsa/key',
                data: JSON.stringify({key: key.public}),
                method: "POST",
                contentType: 'application/json'
            })
                .then(function (data) {
                    var sessionKey = data;
                    return importKey(key.private)
                        .then(function (result) {
                            return crypto.subtle.decrypt({name: "RSA-OAEP"}, result, str2ab(atob(sessionKey.sessionKeyBase64)))
                                .then(function (ke) {
                                    localStorage.setItem("session_key", ab2str(ke));
                                })
                                .catch(function (err) {
                                    console.warn(err);
                                });
                        });
                })
        });
}

function str2ab(str) {
    var buf = new ArrayBuffer(str.length); // 2 bytes for each char
    var bufView = new Uint8Array(buf);
    for (var i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}

function ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint16Array(buf));
}

function processSessionKey() {
    return generateSessionKey()
        .then(function (key) {
            localStorage.setItem("session_key", key);
            return key;
        });
}

function getSessionKey() {
    return localStorage.getItem("session_key");
}

function saveFileSecured(fileName, fileContent) {
    return $.ajax({
        url: '/save-file',
        data: JSON.stringify({fileName: fileName, fileContent: fileContent}),
        method: "POST",
        contentType: 'application/json'
    });
}

function getFileSecured(fileName) {
    return $.ajax({
        url: '/get-file',
        data: JSON.stringify({fileName: fileName}),
        method: "POST",
        contentType: 'application/json'
    });
}