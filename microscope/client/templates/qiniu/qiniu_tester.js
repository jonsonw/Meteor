Template.qiniu_tester.events({
    "click button.upload": function(){
        var file = $("#uploader").val();
        var f = document.getElementById("uploader").files;
        //var fileName = file.replace(/^.+?\\([^\\]+?)(\.[^\.\\]*?)?$/gi,"$1");  //正则表达式获取文件名，不带后缀 
        //var FileExt = file.replace(/.+\./,"");   //正则表达式获取后;
        var key = f[0].name;
        Meteor.call('qn_upload', file, key, function(e,r){
                console.log(r);
        });

    }
})
