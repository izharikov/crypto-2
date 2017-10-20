var isNew = false;

function getRSAPublicKey() {
    var key = localStorage.getItem("rsa_key");
    if (!key) {
        isNew = true;
        key = JSON.stringify(keypair({bits: 512}));
        localStorage.setItem("rsa_key", key);
    }
    key = JSON.parse(key);
    return key.public;
}

function getPrivateRSAKey(){
    return localStorage.getItem("rsa_key").private;
}

var key = getRSAPublicKey();

if (isNew) {
    $.ajax({
        url: '/set-public-rsa-key',
        data: {key : key}
    }).then(function(data){

    })
}

