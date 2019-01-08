import {Template} from "meteor/templating";
import {topics} from "../collections/topic.js";
import {_} from "meteor/underscore";
import * as toastr from "toastr";
import 'toastr/build/toastr.min.css';
import moment from "moment";
import {Meteor} from "meteor/meteor";
import {Session} from "meteor/session";
Template.topic.onRendered(function () {
    var $grid =$('.grid').masonry({
        itemSelector: '.grid-item',
        columnWidth: 300
    });
    $grid.imagesLoaded().progress( function() {
        $grid.masonry();
    });
});

Template.topic.helpers({
   allTopics(){
       var allTopics=topics.find({},{sort: {createTime: -1}}).fetch();
       for(var i=0,len=allTopics.length;i<len;i++){
           var blogID=allTopics[i].ablogID[allTopics[i].ablogID.length-1];
           var latestTopicBlog=blogs.findOne({_id:blogID});
           allTopics[i].currentTopicBlogContext=latestTopicBlog.blogContext;
           if(latestTopicBlog.imgs.length>0){
               allTopics[i].currentTopicBlogImg=latestTopicBlog.imgs[0];
               allTopics[i].hasImage=1;
           }
       }
       return allTopics;
   },
    hasImg(hasImg){
       return hasImg>0;
    },
    isFollow(topicID){
        return _.contains(Meteor.user().profile.followTopics, topicID);
    }
});

Template.topic.events({
    'click .followTopic':function (event) {
        toastr.options.positionClass = 'toast-top-center';
        if(Meteor.user()){
            //判断当前用户是否关注了当前话题
            if(_.contains(Meteor.user().profile.followTopics,$(event.currentTarget).data("id"))){
                //已关注的情况下点击按钮取消关注
                Meteor.users.update(Meteor.userId(),{$pull:{"profile.followTopics": $(event.currentTarget).data("id")}});
            }else{
                //未关注的情况下点击按钮添加关注
                Meteor.users.update(Meteor.userId(),{$push:{"profile.followTopics": $(event.currentTarget).data("id")}});
            }
        }else {
            toastr.error("请先登录！");
        }
    },
    'click .enterTopic':function (event) {
        let topicID=$(event.currentTarget).data('id');
        Router.go("/topic/"+topicID);
    }
});

Template.topicItem.onRendered(function () {
    $("#modal-blogContext").emojioneArea({
        filtersPosition: "bottom",
        pickerPosition: "bottom",
        tones:false
    });
});
Template.topicItem.helpers({
   header(){
       const topicID=Router.current().params.topicID;
       let topicHeader=topics.findOne({'_id':topicID},{name:1,createTime:1,hostName:1});
       topicHeader.createTime = moment(topicHeader.createTime).format("YYYY年MM月DD日 HH:mm");
       return topicHeader;
   },
    topics(){
        const topicID=Router.current().params.topicID;
        let topicBlogID=topics.findOne({'_id':topicID},{ablogID:1});
        let blogItem=blogs.find({'_id':{"$in":topicBlogID["ablogID"]}},{sort:{createTime:-1}}).fetch();
        for (let i = 0, len = blogItem.length; i < len; i++) {
            blogItem[i].createTime = moment(blogItem[i].createTime).format("YYYY年MM月DD日 HH:mm");
            let user = Meteor.users.findOne(blogItem[i].user_id);
            if (user && user.profile && user.profile.display_picture) {
                blogItem[i].display_picture = user.profile.display_picture;
            }
        }
        return blogItem
    },
    isMe(userID){
        return userID==Meteor.userId();
    },
    isApplyHost(){
        const topicID=Router.current().params.topicID;
        let hostCandidate=topics.findOne({'_id':topicID},{candidatePerson:1});
        return _.contains(hostCandidate.candidatePerson, Meteor.userId());
    },
    isHost(){
        const topicID=Router.current().params.topicID;
        let hostID=topics.findOne({'_id':topicID},{hostID:1});
        return _.isEqual(hostID.hostID, Meteor.userId());
    }
});

Template.topicItem.events({
    'load .blog-picture': function (event) {
        var zo = $('.blog-picture').zoomify();
        zo.zoomify().on({
            'zoom-out-complete.zoomify': function () {
                $('.zoomify-shadow').remove();
            }
        })
    },
    //申请主持人
    'click .applyHost':function () {
        toastr.options.positionClass = 'toast-top-center';
        if(Meteor.user()) {
            const topicID = Router.current().params.topicID;
            topics.update({"_id": topicID}, {$push: {"candidatePerson": Meteor.userId()}});
            toastr.success("申请成功！");
        }else{
            toastr.error("请先登录！");
        }
    },
    //取消申请主持人
    'click .canelApplyHost':function () {
        toastr.options.positionClass = 'toast-top-center';
        const topicID = Router.current().params.topicID;
        topics.update({"_id": topicID}, {$pull: {"candidatePerson": Meteor.userId()}});
        toastr.warning("已取消！");
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