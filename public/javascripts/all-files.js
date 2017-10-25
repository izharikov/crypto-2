function createFilePost(fileName) {
    return $.ajax({
        url: '/create-file',
        data: JSON.stringify({fileName: fileName}),
        method: "POST",
        contentType: 'application/json'
    });
}

function createFile() {
    var fileName = $("#file-name").val();
    createFilePost(fileName)
        .then(function (result) {
            window.location.href = "/file/" + fileName;
        })
}

$("#create-file").click(createFile);

$("#regenerate-rsa").click(function(){
    localStorage.setItem("session_key", "");
    generateSessionKey()
        .then(function(){
            location.reload();
        })
});