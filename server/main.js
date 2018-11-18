import { Meteor } from 'meteor/meteor';
import '../collections/blog.js';

const fs=require('fs');
Meteor.startup(() => {

});

Meteor.methods({
    writeFile:function (url,data,userID) {
        //判断是否存在userID这个目录
        if(!fs.exists("E:\\blog\\public\\imgs\\"+userID,function (exits) {
            console.log(exits?"":userID+"目录不存在，准备创建。");
        })){
            fs.mkdir("E:\\blog\\public\\imgs\\"+userID,function (err) {
                if(err){
                    console.log(err);
                }else{
                    console.log(userID+"用户目录创建成功");
                }
            })
        }
        fs.writeFile(url,data,"binary",function (err) {
            if(err) console.log('写入文件失败！'+err) ;
            else console.log('写入文件成功！');
        })
    },
    deleteFile:function (url) {
        fs.unlink("E:\\blog\\public"+url,function (err) {
            if(err){
                console.log(err);
            }else{
                console.log(url+"图片删除成功");
            }
        })
    },
    readFile:function (url) {
        var result =fs.readFileSync("E:\\blog\\public"+url,"base64");
        var suffixFileName=url.substring(url.lastIndexOf('.')+1, url.length);
        if(suffixFileName=="jpg"){
            return "data:image/jpeg;base64,"+result;
        }else{
            return "data:image/"+suffixFileName+";base64,"+result;
        }

    }
});

//创建用户时自动填充头像
Accounts.onCreateUser(function (options,user) {
    user.profile = options.profile;
    return user;
});

Meteor.users.allow({
   update:function () {
       return true;
   }
});
