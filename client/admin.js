import {Template} from 'meteor/templating';
import moment from "moment";
import {Meteor} from "meteor/meteor";
import {topics} from "../collections/topic";

Template.adminLogin.events({
    'click .adminLoginBtn':function (event) {
        event.preventDefault();
        const userName=$('#inputUser').val();
        const password=$('#inputPassword').val();
        if(userName=='admin'&&password=='admin'){
            Session.set('isAdminLogin',1);
            Session.set('isAdminUser',1);
            Session.set('isAdminBlog',0);
            Session.set('isAdminTopic',0);
        }else{
            alert('密码错误！');
        }
    }
});

Template.admin.events({
    'click .adminLogout':function () {
        Session.set('isAdminLogin',0);
    },
    'click .adminBlog':function () {
        Session.set('isAdminUser',0);
        Session.set('isAdminBlog',1);
        Session.set('isAdminTopic',0);
    },
    'click .adminTopic':function () {
        Session.set('isAdminUser',0);
        Session.set('isAdminBlog',0);
        Session.set('isAdminTopic',1);
    },
    'click .adminUser':function () {
        Session.set('isAdminUser',1);
        Session.set('isAdminBlog',0);
        Session.set('isAdminTopic',0);
    }

});

//用户管理
Template.adminUser.helpers({
   allUser(){
       // Meteor.subscribe("users");
       // console.log(Meteor.users.findOne());
       return Meteor.users.find().fetch();
   },
    userStatus(status){
        return status=="normal";
    }

});

Template.adminUser.events({
    "click .deleteUser":function (event) {
        const userID=$(event.currentTarget).data("id");
        Meteor.users.remove({_id:userID});
    },
    "click .closeUser":function (event) {
        const userID=$(event.currentTarget).data("id");
        Meteor.users.update({_id:userID},{$set:{"profile.status":"closed"}});
    },
    "click .uncloseUser":function (event) {
        const userID=$(event.currentTarget).data("id");
        Meteor.users.update({_id:userID},{$set:{"profile.status":"normal"}});
    }
});
//用户管理结束
//微博管理
Template.adminBlog.helpers({
    allBlog(){
        let blog=blogs.find().fetch();
        for (let i = 0, len = blog.length; i < len; i++) {
            blog[i].createTime = moment(blog[i].createTime).format("YYYY年MM月DD日 HH:mm");
        }
        return blog;
    }


});
Template.adminBlog.events({
    "click .deleteBlog":function (event) {
        const blogID=$(event.currentTarget).data("id");
        blogs.remove({_id:blogID});
    }
});
//微博管理结束
//话题管理
Template.adminTopic.helpers({
    allTopic(){
        let topic=topics.find().fetch();
        for (let i = 0, len = topic.length; i < len; i++) {
            topic[i].createTime = moment(topic[i].createTime).format("YYYY年MM月DD日 HH:mm");
        }
        return topic;
    },
    allCandidatePerson(){
        return Session.get('allCandidatePerson');
    }


});

Template.adminTopic.events({
    "click .deleteTopic":function (event) {
        const topicID=$(event.currentTarget).data("id");
        let users=Meteor.users.find({'profile.followTopics':{"$in":[topicID]}}).fetch();
        for(let i=0;i<users.length;i++){
            Meteor.users.update({_id:users[i]._id},{$pull:{"profile.followTopics":topicID}});
        }
        topics.remove({_id:topicID});
    },
    'click .catHostCandidatePerson':function (event) {
        const topicID=$(event.currentTarget).data("id");
        const allCandidatePerson=topics.findOne({_id:topicID}).candidatePerson;
        for(let i=0;i<allCandidatePerson.length;i++){
            allCandidatePerson[i]={id:allCandidatePerson[i],username:Meteor.users.findOne({_id:allCandidatePerson[i]}).username};

        }
        Session.set('topicID',topicID);
        Session.set('allCandidatePerson',allCandidatePerson);

    },
    'click .approveCandidatePerson':function (event) {
        const candidatePersonID=$(event.currentTarget).data("id");
        const username=Meteor.users.findOne({_id:candidatePersonID}).username;
        const topicID=Session.get('topicID');
        topics.update({_id:topicID},{$set:{'hostID':candidatePersonID,'hostName':username}});
        topics.update({_id:topicID},{$pull:{candidatePerson:candidatePersonID}});
        $('#modalCandidatePerson').modal('hide')
    },

});
//话题管理结束
