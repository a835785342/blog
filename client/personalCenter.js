import {Template} from 'meteor/templating';
import * as toastr from "toastr";
import 'toastr/build/toastr.min.css';
import { _ } from 'meteor/underscore';
import moment from "moment";
import {Session} from "meteor/session";
import './blogUtil.js';

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

//获取guid方法
function guid() {
    function S4() {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    }

    return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
}

