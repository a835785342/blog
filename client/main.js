import {Template} from 'meteor/templating';
import './main.html';
import '../routers/router.js';
import '../collections/blog.js';
import './layout/masterLayout';
import moment from "moment";
import '../static/css/zoomify.min.css';
import '../static/js/zoomify.min.js';
import './personalCenter.js';
import './search.js';
import * as toastr from "toastr";
import { Session } from 'meteor/session'
import { _ } from 'meteor/underscore';
import "../static/js/emojione.js";
import "../static/css/emojione.sprites.css";
import "emojionearea/dist/emojionearea.css";
import "emojionearea/dist/emojionearea.js";


Template.publicBlog.onRendered(function () {
    $("#blogContext").emojioneArea({
        filtersPosition: "bottom",
        pickerPosition: "bottom",
        tones:false
    });
});
Template.publicBlog.events({
    //发表微博
    'click #publicBlogBtn': function (event) {
        if (Meteor.user() != null) {
            var imgUUID = new Array();
            var time = new Date();
            var blogContext = $("#blogContext").val();
            var imgs = document.getElementById("uploadImg1");
            if((blogContext==""||blogContext==null)&&imgs.files.length==0){
                if($(".blogEmpty-alert").length>0){
                    return;
                }
                $("#publicBlog").before("<div class='alert alert-danger alert-dismissible blogEmpty-alert fade in' role='alert' style='margin-top: 20px'><button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'>&times;</span></button>请输入要发布的微博内容</div>");
                return;
            }
            if(imgs.files.length>0){
                var i = 0;
                var reader1 = new FileReader();
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
                    console.log(imgUUID);

                    //把图片保存在本地
                    Meteor.call('writeFile', 'E:\\blog\\public\\imgs\\' + Meteor.userId()+"\\"+uuid + suffixFileName, e.target.result,Meteor.userId(), function (err) {
                        if (err) console.log(err);

                    });

                    i++;
                    if (i < imgs.files.length) {
                        reader1.readAsBinaryString(imgs.files[i]);
                    }
                    if (i == imgs.files.length) {
                        // 把微博内容数据插入数据库
                        var blogID = blogs.insert({
                            user_id: Meteor.userId(),
                            createTime: time,
                            userName: Meteor.user().username,
                            imgs: imgUUID,
                            blogContext: blogContext
                        });
                        Meteor.users.update(Meteor.userId(), {$push: {"profile.blogs": blogID}});
                    }

                };
                reader1.readAsBinaryString(imgs.files[0]);
            }else{
                var blogID = blogs.insert({
                    user_id: Meteor.userId(),
                    createTime: time,
                    userName: Meteor.user().username,
                    imgs: imgUUID,
                    blogContext: blogContext
                });
                Meteor.users.update(Meteor.userId(), {$push: {"profile.blogs": blogID}});
            }


            //发布微博后把临时图片ID数组清空
            imgUUID = [];
            $("#blogContext")[0].emojioneArea.setText("");
            $(".thumbnail-img .glyphicon-remove").click();
            //弹出提示框发布成功
            toastr.options.positionClass = 'toast-top-center';
            toastr.warning("发布成功！");
        } else {
            alert("请登陆！");
        }

    },
    //选取图片
    'click #uploadImg': function (event) {
        event.preventDefault();
        $('#uploadImg1').click();
    },
    'change #uploadImg1': function (event) {
        $(".thumbnail-img img").remove();
        //显示缩略图
        $.each(event.currentTarget.files, function (i, val) {
            var reader = new FileReader();
            reader.onload = function (e) {

                $('.thumbnail-img').css('visibility', 'visible');
                $('.thumbnail-img').append("<img src='" + e.target.result + "' class='img-rounded' height='80' width='80' onerror=\"javascript:this.src='imgs/load-picture.gif';\"/>");
            };
            reader.readAsDataURL(event.currentTarget.files[i]);

        });
    },

    //关闭选择图片缩略图
    'click .thumbnail-img .glyphicon-remove': function (event) {
        event.preventDefault();
        $('.thumbnail-img').css('visibility', 'hidden');
        var file = $("#uploadImg1");
        file.after(file.clone().val(""));
        file.remove();
        $(".thumbnail-img img").remove();
    }


});

Template.blogContext.onRendered(function () {
    $("#modal-blogContext").emojioneArea({
        filtersPosition: "bottom",
        pickerPosition: "bottom",
        tones:false
    });
});

Template.blogContext.helpers({
    blogs() {
        var blog = blogs.find({}, {sort: {createTime: -1}}).fetch();

        for (var i = 0, len = blog.length; i < len; i++) {
            blog[i].createTime = moment(blog[i].createTime).format("YYYY年MM月DD日 HH:mm");
            var user = Meteor.users.findOne(blog[i].user_id);
            if (user && user.profile && user.profile.display_picture) {
                blog[i].display_picture = user.profile.display_picture;
            }
        }
        return blog;
    },
    isMe(userID){
        return userID==Meteor.userId();
    }

});

Template.blogContext.events({
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
        var blogContent=blogs.findOne(Session.get("blogID"));
        _.each(blogContent.imgs,function (element, index, list) {
            Meteor.call("deleteFile",element,function (err) {
                if (err) console.log(err);
            })
        });
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
        // $("#modal-blogContext").text(updateBlogContent.blogContext);
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

Template.blogContext.uihooks({
    ".blog": {
        container: ".blogContext",
        insert: function (node, next, tpl) {
            $(node).fadeIn('slow');
            $(node).insertBefore(next);
        },
        remove: function (node, tpl) {
            $(node).fadeOut('slow');
        }
    }
});

Template.myAttentionsBlogs.helpers({
    isMe(userID){
        return userID==Meteor.userId();
    },
    myAttentionsBlogs() {
        var attentionUser_id = new Array();
        attentionUser_id = Meteor.user().profile.attentions;

        var blog = blogs.find({"user_id": {"$in": attentionUser_id}}, {sort: {createTime: -1}}).fetch();
        for (var i = 0, len = blog.length; i < len; i++) {
            blog[i].createTime = moment(blog[i].createTime).format("YYYY年MM月DD日 HH:mm");
            var user = Meteor.users.findOne(blog[i].user_id);
            if (user && user.profile && user.profile.display_picture) {
                blog[i].display_picture = user.profile.display_picture;
            }
        }
        return blog;
    }
});


//获取guid方法
function guid() {
    function S4() {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    }

    return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
}







