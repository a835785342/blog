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
import './topic.js';
import './admin.js';
import * as toastr from "toastr";
import { Session } from 'meteor/session'
import { _ } from 'meteor/underscore';
import "../static/js/emojione.js";
import "../static/css/emojione.sprites.css";
import "emojionearea/dist/emojionearea.css";
import "emojionearea/dist/emojionearea.js";
import {Meteor} from "meteor/meteor";
import "./blogUtil.js";
import {topics} from "../collections/topic";



Template.publicBlog.onRendered(function () {
    $("#blogContext").emojioneArea({
        filtersPosition: "bottom",
        pickerPosition: "bottom",
        tones:false,
        useInternalCDN: false,
        autocomplete: false
    });
});
Template.publicBlog.events({
    //点击发表微博按钮
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
                        //换行
                        blogContext=blogContext.replace(/(\r\n)|(\n)/g,'<br>');
                        // 把微博内容数据插入数据库
                        var blogID = blogs.insert({
                            user_id: Meteor.userId(),
                            createTime: time,
                            userName: Meteor.user().username,
                            imgs: imgUUID,
                            blogContext: blogContext
                        });
                        if(blogContext.indexOf('#',blogContext.indexOf('#')+1)>0){
                            Meteor.call('upsertTopic',blogContext,blogID);
                        }
                        Meteor.users.update(Meteor.userId(), {$push: {"profile.blogs": blogID}});
                    }

                };
                reader1.readAsBinaryString(imgs.files[0]);
            }else{
                //换行
                blogContext=blogContext.replace(/(\r\n)|(\n)/g,'<br>');
                var blogID = blogs.insert({
                    user_id: Meteor.userId(),
                    createTime: time,
                    userName: Meteor.user().username,
                    imgs: imgUUID,
                    blogContext: blogContext
                });
                if(blogContext.indexOf('#',blogContext.indexOf('#')+1)>0){
                    Meteor.call('upsertTopic',blogContext,blogID);
                }
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
    //点击发表微博按钮结束

    //选取图片按钮
    'click #uploadImg': function (event) {
        event.preventDefault();
        $('#uploadImg1').click();
    },
    //选取图片按钮结束

    //点击已经选择好照片后按钮
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
    //点击已经选择好照片后按钮结束

    //关闭选择图片缩略图
    'click .thumbnail-img .glyphicon-remove': function (event) {
        event.preventDefault();
        $('.thumbnail-img').css('visibility', 'hidden');
        var file = $("#uploadImg1");
        file.after(file.clone().val(""));
        file.remove();
        $(".thumbnail-img img").remove();
    },
    //关闭选择图片缩略图结束

    //点击话题按钮
    'click #chooseTopic':function (event) {
        event.preventDefault();
        var blogContext=$('#blogContext').val();
        $("#blogContext")[0].emojioneArea.setText("#在这里输入你想要说的话题#"+blogContext);
    }
    //点击话题按钮结束
});

Template.blogContext.onRendered(function () {
    $("#modal-blogContext").emojioneArea({
        filtersPosition: "bottom",
        pickerPosition: "bottom",
        tones:false,
        useInternalCDN: false,
        autocomplete: false
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
        deleteBlog();
    },
    //修改微博
    'click .updateBlog-a':function (event) {
        updateBlog_a(event);


    },
    'click .updateBlog-btn':function () {
        updateBlog_b();
    },
    //选取图片

    'click #modal-uploadImg': function (event) {
        event.preventDefault();
        $('#modal-uploadImg1').click();
    },
    'change #modal-uploadImg1': function (event) {
        updateBlogImg(event);
    },

    //关闭选择图片缩略图
    'click .modal-thumbnail-img .glyphicon-remove': function (event) {
        closeBlogImg(event);
    },
    //点击话题按钮
    'click #modal-chooseTopic':function (event) {
        event.preventDefault();
        var blogContext=$('#modal-blogContext').val();
        $("#modal-blogContext")[0].emojioneArea.setText("#在这里输入你想要说的话题#"+blogContext);
    }
    //点击话题按钮结束

});


Template.blogContext.uihooks({
    '.blog': {
        container: '#home',
        insert: function(node, next, tpl) {
            $(node).fadeIn('4000');
            $(node).insertBefore(next);
        },
        remove: function(node, tpl) {
            $(node).fadeOut('4000');
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


Template.myAttentionsTopics.helpers({
    isMe(userID){
        return userID==Meteor.userId();
    },
    myAttentionsTopics() {
        let followTopic_id = new Array();
        followTopic_id = Meteor.user().profile.followTopics;
        let allTopics = topics.find({"_id": {"$in": followTopic_id}}).fetch();
        let returnBlogContext=new Array();
        for (let i = 0, len = allTopics.length; i < len; i++) {
            for(let j = (allTopics[i]['ablogID'].length)-1; j >= 0; j--){
                let blogID=allTopics[i]['ablogID'][j];
                let blog=blogs.findOne({"_id":blogID});
                let user = Meteor.users.findOne(blog.user_id);
                returnBlogContext.push({'display_picture':user.profile.display_picture,
                    ['imgs']:blog['imgs'],
                    'userName':blog.userName,
                    'user_id':blog.user_id,
                    'blogContext':blog.blogContext,
                    'blogTime':moment(blog.createTime).format("YYYY年MM月DD日 HH:mm"),
                    '_id':blogID
                });
            }
        }
        return returnBlogContext;
    }
});

//获取guid方法
function guid() {
    function S4() {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    }

    return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
}








