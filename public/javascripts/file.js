function loadFile() {
    var parts = location.pathname.split("/");
    var fileName = parts[parts.length - 1];
    var key = getSessionKey();
    getFileSecured(fileName)
        .then(function (data) {
            $("#fileNameLabel").text(fileName);
            $("#fileNameDiv").text(fileName);
            $("#fileName").val(fileName);
            if (data.keyExpired) {
                alert("Session key expired!")
            }
            $("#fileContent").val(data.file ? serpent.cfb.decrypt(atob(data.file), key) : "");
            $("#file-form").on("submit", function (e) {
                e.preventDefault();
                saveFileSecured(fileName, btoa(serpent.cfb.encrypt($("#fileContent").val(), key)))
                    .then(function () {
                        location.reload();
                    })
            })
        });
}

processSessionKey()
    .then(function () {
        loadFile();
    });