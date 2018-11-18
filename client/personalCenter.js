import {Template} from 'meteor/templating';
import * as toastr from "toastr";
import 'toastr/build/toastr.min.css';
import { _ } from 'meteor/underscore';
import moment from "moment";
import {Session} from "meteor/session";

Template.header.helpers({
    isMe(userID){
        return Meteor.userId() == userID;
    },
    isAllow(userID){
        return _.contains(Meteor.user().profile.attentions, userID);
    }

});

Template.header.events({
    'click .follow':function () {
        toastr.options.positionClass = 'toast-top-center';
        if(Meteor.user()){
            //判断当前用户是否关注了当前页面的用户
            if(_.contains(Meteor.user().profile.attentions,$(".follow").data("id"))){
                //已关注的情况下点击按钮取消关注
                Meteor.users.update(Meteor.userId(),{$pull:{"profile.attentions": $(".follow").data("id")}});
                Meteor.users.update($(".follow").data("id"),{$pull:{"profile.fans":Meteor.userId() }});
                toastr.warning("已取消关注！");
            }else{
                //未关注的情况下点击按钮添加关注
                Meteor.users.update(Meteor.userId(),{$push:{"profile.attentions": $(".follow").data("id")}});
                Meteor.users.update($(".follow").data("id"),{$push:{"profile.fans":Meteor.userId() }});
                toastr.warning("关注成功！");
            }
        }else {
            toastr.error("请先登录！");
        }



    }
});

Template.personalCenter.onRendered(function () {
    $("#modal-blogContext").emojioneArea({
        filtersPosition: "bottom",
        pickerPosition: "bottom",
        tones:false
    });
});
Template.personalCenter.helpers({
    isMe(userID){
        return Meteor.userId() == userID;
    },
    blogs(userID){
        var blog = blogs.find({user_id:userID}, {sort: {createTime: -1}}).fetch();
        for (var i = 0, len = blog.length; i < len; i++) {
            blog[i].createTime = moment(blog[i].createTime).format("YYYY年MM月DD日 HH:mm");
            var user = Meteor.users.findOne(blog[i].user_id);
            if (user && user.profile && user.profile.display_picture) {
                blog[i].display_picture = user.profile.display_picture;
            }
        }
        return blog;
    },
    attentions() {
        var attentionUser_id = new Array();
        if(Router.current().params._id!=Meteor.userId()){
            attentionUser_id=Meteor.users.findOne(Router.current().params._id).profile.attentions;
        }else{
            attentionUser_id = Meteor.user().profile.attentions;
        }

        var user = Meteor.users.find({"_id": {"$in": attentionUser_id}}, {sort: {createTime: -1}}).fetch();
        return user;
    },
    fans() {
        var fansUser_id = new Array();
        if(Router.current().params._id!=Meteor.userId()){
            fansUser_id=Meteor.users.findOne(Router.current().params._id).profile.fans;
        }else{
            fansUser_id = Meteor.user().profile.fans;
        }
        var user = Meteor.users.find({"_id": {"$in": fansUser_id}}, {sort: {createTime: -1}}).fetch();
        return user;
    }
});
Template.personalCenter.events({
    'load .blog-picture': function (event) {
        var zo = $('.blog-picture').zoomify();
        zo.zoomify().on({
            'zoom-out-complete.zoomify': function () {
                $('.zoomify-shadow').remove();
            }
        })
    },
    //删除微博
    'click .deleteBlog-a':function (event) {
        Session.set("blogID",$(event.currentTarget).data("blogid"));
    },
    'click .deleteBlog-btn':function () {
        blogs.remove(Session.get("blogID"));
        Meteor.users.update(Meteor.userId(),{$pull:{"profile.blogs":Session.get("blogID")}});
        toastr.options.positionClass = 'toast-top-center';
        toastr.success("删除成功！");
        $('.cancel-btn').click();
    },
    //修改微博
    'click .updateBlog-a':function (event) {
        Session.set("blogID",$(event.currentTarget).data("blogid"));
        var updateBlogContent=blogs.findOne($(event.currentTarget).data("blogid"));
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


    },
    'click .updateBlog-btn':function () {
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
                    blogs.update(Session.get("blogID"),{
                        user_id: updateBlogContent.user_id,
                        createTime: updateBlogContent.createTime,
                        userName: updateBlogContent.userName,
                        imgs: imgUUID,
                        blogContext: blogContext
                    });
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
        }
        //发布微博后把临时图片ID数组清空
        imgUUID.length=0;
        $(".modal-thumbnail-img .glyphicon-remove").click();
        toastr.success("修改成功！");
        $('.cancel-btn').click();
    },
    //选取图片
    'click #modal-uploadImg': function (event) {
        event.preventDefault();
        $('#modal-uploadImg1').click();
    },
    'change #modal-uploadImg1': function (event) {
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
    },

    //关闭选择图片缩略图
    'click .modal-thumbnail-img .glyphicon-remove': function (event) {
        event.preventDefault();
        $('.modal-thumbnail-img').css('visibility', 'hidden');
        var file = $("#modal-uploadImg1");
        file.after(file.clone().val(""));
        file.remove();
        $(".modal-thumbnail-img img").remove();
    }
});

//获取guid方法
function guid() {
    function S4() {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    }

    return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
}

