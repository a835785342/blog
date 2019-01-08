import {Session} from "meteor/session";
import {_} from "meteor/underscore";
import {Meteor} from "meteor/meteor";
import * as toastr from "toastr";
import "../static/js/emojione.js";
import "../static/css/emojione.sprites.css";
import "emojionearea/dist/emojionearea.css";
import "emojionearea/dist/emojionearea.js";

//点击删除微博后的逻辑处理
deleteBlog=function () {
    var blog=blogs.findOne(Session.get("blogID"));
    _.each(blog.imgs,function (element, index, list) {
        Meteor.call("deleteFile",element,function (err) {
            if (err) console.log(err);
        })
    });
    blogs.remove(Session.get("blogID"));
    Meteor.users.update(Meteor.userId(),{$pull:{"profile.blogs":Session.get("blogID")}});
    if(blog.blogContext.indexOf('#',blog.blogContext.indexOf('#')+1)>0){
        Meteor.call('deleteTopic',blog.blogContext,Session.get("blogID"));
    }
    toastr.options.positionClass = 'toast-top-center';
    toastr.success("删除成功！");
    $('.cancel-btn').click();
};

//点击修改微博后的逻辑处理
updateBlog_a=function (event) {
    Session.set("blogID",$(event.currentTarget).data("blogid"));
    const updateBlogContent = blogs.findOne($(event.currentTarget).data("blogid"));
    if(updateBlogContent.blogContext.indexOf('#',updateBlogContent.blogContext.indexOf('#')+1)>0){
        const topicName=getTopicName(updateBlogContent.blogContext);
        Session.set('topicName',topicName);
    }

    $("#modal-blogContext")[0].emojioneArea.setText(updateBlogContent.blogContext);
    //判断有没有图片
    if(updateBlogContent.imgs[0]){
        $('.modal-thumbnail-img').css('visibility', 'visible');
        _.each(updateBlogContent.imgs,function (element, index, list) {
            Meteor.call("readFile",element,function (err,result) {
                if(err){
                    console.log(err);
                }else{
                    $('.modal-thumbnail-img').append("<img src='" + result + "' class='img-rounded' height='80' width='80' onerror=\"javascript:this.src='imgs/load-picture.gif';\"/>")
                }
            });
        })
    }
    $(".updateBlog-modal").on('hidden.bs.modal',function () {
        var file = $("#modal-uploadImg1");
        file.after(file.clone().val(""));
        file.remove();
        $(".modal-thumbnail-img img").remove();
        $('.modal-thumbnail-img').css('visibility', 'hidden');
    });
};

//模态框修改微博确定按钮
updateBlog_b=function () {
    toastr.options.positionClass = 'toast-top-center';

    const blogContext = $("#modal-blogContext").val();
    const updateBlogContent = blogs.findOne(Session.get("blogID"));
    const imgUUID = updateBlogContent.imgs;
    const imgs = document.getElementById("modal-uploadImg1");
    if((blogContext==""||blogContext==null)&&imgs.files.length==0){
        toastr.warning("请输入内容！");
        return;
    }
    if(imgs.files.length>0){
        //把原来的旧图片删除
        if(imgUUID.length>0){
            _.each(imgUUID,function (element, index, list) {
                Meteor.call("deleteFile",element,function (err) {
                    if(err) console.log(err);
                });
            });
        }
        imgUUID.length=0;
        let i = 0;
        const reader1 = new FileReader();
        reader1.onload = function (e) {
            // 获取上传文件图片的后缀
            let fileName = "";
            if (imgs && imgs.files[i] && imgs.files[i].name) {
                fileName = imgs.files[i].name;
            }

            const suffixFileName = fileName.substring(fileName.lastIndexOf('.'), fileName.length);
            const uuid = guid();
            // 向数组添加图片uuid
            imgUUID.push("/imgs/" +Meteor.userId()+ "/"+uuid + suffixFileName);

            //把图片保存在本地
            Meteor.call('writeFile', 'E:\\blog\\public\\imgs\\' + Meteor.userId()+"\\"+uuid + suffixFileName, e.target.result,Meteor.userId(), function (err) {
                if (err) console.log(err);

            });

            i++;
            if (i < imgs.files.length) {
                reader1.readAsBinaryString(imgs.files[i]);
            }
            if (i == imgs.files.length) {


                // 修改数据库内的微博数据
                blogs.update(Session.get("blogID"), {
                    user_id: updateBlogContent.user_id,
                    createTime: updateBlogContent.createTime,
                    userName: updateBlogContent.userName,
                    imgs: imgUUID,
                    blogContext: blogContext
                });
                if(blogContext.indexOf('#',blogContext.indexOf('#')+1)>0){
                    var topicName=getTopicName(blogContext);
                    if(Session.equals('topicName',undefined)) {
                        Meteor.call('upsertTopic', blogContext, Session.get('blogID'));
                        delete Session.keys['topicName'];
                    }else if(!Session.equals('topicName',topicName)){
                        Meteor.call('deleteTopic',updateBlogContent.blogContext,Session.get('blogID'));
                        Meteor.call('upsertTopic',blogContext,Session.get('blogID'));
                        delete Session.keys['topicName'];
                    }
                }else{
                    Meteor.call('deleteTopic',updateBlogContent.blogContext,Session.get('blogID'));
                    delete Session.keys['topicName'];
                }
            }

        };
        reader1.readAsBinaryString(imgs.files[0]);
    }else{
        if($(".modal-thumbnail-img").css("visibility")=="hidden"){
            _.each(imgUUID,function (element, index, list) {
                Meteor.call("deleteFile",element,function (err) {
                    if(err) console.log(err);
                });
            });
            imgUUID.length=0;
        }
        blogs.update(Session.get("blogID"),{
            user_id: updateBlogContent.user_id,
            createTime: updateBlogContent.createTime,
            userName: updateBlogContent.userName,
            imgs: imgUUID,
            blogContext: blogContext
        });
        if(blogContext.indexOf('#',blogContext.indexOf('#')+1)>0){
            const topicName = getTopicName(blogContext);
            if(Session.equals('topicName',undefined)){
                Meteor.call('upsertTopic',blogContext,Session.get('blogID'));
                delete Session.keys['topicName'];
            } else if(!Session.equals('topicName',topicName)){
                Meteor.call('deleteTopic',updateBlogContent.blogContext,Session.get('blogID'));
                Meteor.call('upsertTopic',blogContext,Session.get('blogID'));
                delete Session.keys['topicName'];
            }
        }else{
            Meteor.call('deleteTopic',updateBlogContent.blogContext,Session.get('blogID'));
            delete Session.keys['topicName'];
        }
    }
    //发布微博后把临时图片ID数组清空
    imgUUID.length=0;
    $(".modal-thumbnail-img .glyphicon-remove").click();
    toastr.success("修改成功！");
    $('.cancel-btn').click();
};

//模态框修改图片
updateBlogImg=function (event) {
    $(".modal-thumbnail-img img").remove();
    //显示缩略图
    $.each(event.currentTarget.files, function (i, val) {
        var reader = new FileReader();
        reader.onload = function (e) {

            $('.modal-thumbnail-img').css('visibility', 'visible');
            $('.modal-thumbnail-img').append("<img src='" + e.target.result + "' class='img-rounded' height='80' width='80' />");
        };
        reader.readAsDataURL(event.currentTarget.files[i]);

    });
    alert('文件读取完成');
};

//模态框关闭图片
closeBlogImg=function (event) {
    event.preventDefault();
    $('.modal-thumbnail-img').css('visibility', 'hidden');
    var file = $("#modal-uploadImg1");
    file.after(file.clone().val(""));
    file.remove();
    $(".modal-thumbnail-img img").remove();
};

//获取话题名称
function getTopicName(blogContext) {
    const re=/(?<=#).+?(?=#)/g;
    const topicName=re.exec(blogContext);
    return topicName[0];
}