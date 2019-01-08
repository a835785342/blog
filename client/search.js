import moment from "moment";
import {Template} from "meteor/templating";
import {Session} from "meteor/session";
import {_} from "meteor/underscore";
import * as toastr from "toastr";
import {topics} from "../collections/topic.js";
import "../static/js/emojione.js";
import "../static/css/emojione.sprites.css";
import "emojionearea/dist/emojionearea.css";
import "emojionearea/dist/emojionearea.js";
import './blogUtil.js';
import {Meteor} from "meteor/meteor";
Template.searchContext.onRendered(function () {
    $("#modal-blogContext").emojioneArea({
        filtersPosition: "bottom",
        pickerPosition: "bottom",
        tones:false
    });
});

Template.searchContext.helpers({
    isMe(userID){
        return userID==Meteor.userId();
    },
    blogs(){
        let searchContext=Router.current().params.searchContext;
        let blog = blogs.find({blogContext:{$regex:searchContext,$options:'i'}}, {sort: {createTime: -1}}).fetch();
        for (var i = 0, len = blog.length; i < len; i++) {
            blog[i].createTime = moment(blog[i].createTime).format("YYYY年MM月DD日 HH:mm");
            var user = Meteor.users.findOne(blog[i].user_id);
            if (user && user.profile && user.profile.display_picture) {
                blog[i].display_picture = user.profile.display_picture;
            }
        }
        return blog;
    },
    users(){
        var searchContext=Router.current().params.searchContext;
        return Meteor.users.find({username:{$regex:searchContext,$options:'i'}}, {sort: {createdAt: -1}}).fetch();
    },
    topics(){
        let searchContext=Router.current().params.searchContext;
        console.log(topics.find({"name":{$regex:searchContext,$options:'i'}},{sort:{createTime:-1}}).fetch());
        return topics.find({"name":{$regex:searchContext,$options:'i'}},{sort:{createTime:-1}}).fetch();
    }
});

Template.searchContext.events({
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