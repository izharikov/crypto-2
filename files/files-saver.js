var fs = require('fs');

var config = {
    filePath : "/home/igor/WebstormProjects/CryptoServer/files-saved/"
};

var fileTools = (function(){
    return {
        read: function(fileName){
            return new Promise(function(resolve, reject){
                fs.readFile(config.filePath + fileName, function(err, data){
                    if (err)
                        reject(err);
                    else
                        resolve(data);
                });
            })
        },
        allFiles: function(){
            return new Promise(function(resolve, reject){
                fs.readdir(config.filePath, function(err, data){
                    if (err)
                        reject(err);
                    else
                        resolve(data);
                })
            })
        }
    }
})();

module.exports = fileTools;