var fs = require('fs');

const fileEncryption = require('../crypto/files-encryption');

var config = {
    filePath: "/home/igor/WebstormProjects/CryptoServer/files-saved/"
};

var fileTools = (function () {
    return {
        read: function (fileName) {
            return new Promise(function (resolve, reject) {
                fs.readFile(config.filePath + fileName, function (err, data) {
                    if (err)
                        reject(err);
                    else {
                        let decryptedData = fileEncryption.decrypt(data.toString());
                        resolve(decryptedData);
                    }
                });
            })
        },
        allFiles: function () {
            return new Promise(function (resolve, reject) {
                fs.readdir(config.filePath, function (err, data) {
                    data = data.filter(item => !(/(^|\/)\.[^\/\.]/g).test(item)); // don't return hidden files
                    if (err)
                        reject(err);
                    else
                        resolve(data);
                })
            })
        },
        write: function (fileName, content) {
            return new Promise(function (resolve, reject) {
                let encryptedContent = fileEncryption.encrypt(content);
                fs.writeFile(config.filePath + fileName, encryptedContent, function (err, data) {
                    if (err)
                        reject(err);
                    else
                        resolve(data);
                });
            })
        }
    }
})();

module.exports = fileTools;