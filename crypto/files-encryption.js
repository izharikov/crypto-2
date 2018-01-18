const fileTools = {
    encrypt: encrypt,
    decrypt: decrypt
};

const keys = require('../keys/keys.json');

const crypto = require('crypto'),
algorithm = 'aes-256-ctr',
password = keys.file_key;

function encrypt(text){
    var cipher = crypto.createCipher(algorithm,password)
    var crypted = cipher.update(text,'utf8','hex')
    crypted += cipher.final('hex');
    return crypted;
}

function decrypt(text){
    var decipher = crypto.createDecipher(algorithm,password)
    var dec = decipher.update(text,'hex','utf8')
    dec += decipher.final('utf8');
    return dec;
}


var hw = encrypt(new Buffer("hello world", "utf8"))

module.exports = fileTools;