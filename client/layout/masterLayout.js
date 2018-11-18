import './masterLayout.css';

//设置账号为简体中文
accountsUIBootstrap3.setLanguage('zh-CN');

//用户注册配置
Accounts.ui.config({
    //使用用户名和可选的电子邮件
    passwordSignupFields: 'USERNAME_AND_OPTIONAL_EMAIL',
    forceEmailLowercase: true
});

//传输自定义创建用户数据
accountsUIBootstrap3.setCustomSignupOptions = function () {
    return {
        profile: {
            display_picture: "/imgs/blogHead.jpg",
            fans: new Array(),
            blogs: new Array(),
            attentions: new Array()
        }
    }
};

//跳转到个人中心页面
Template._loginButtonsLoggedInDropdown.events({
    'click #login-buttons-edit-profile': function (event) {
        Router.go('personalCenter', {_id: Meteor.userId()});
    }
});

Template.personalInformation.helpers({
   pi(){
       var userID=Router.current().params._id;
       if(userID){
           return Meteor.users.findOne(userID);
       }else if(Meteor.user()){
           return Meteor.user()
       }else{
           return false;
       }
   }
});

//退出登录时回到首页
accountsUIBootstrap3.logoutCallback = function (error) {
    if (error) console.log("Error:" + error);
    Router.go('/');
};

Template.masterLayout.events({
    "click .search-span":function (event) {
        Router.go("/search/"+$(".search-input").val());
        $(".search-input").val("");
    },
    "keydown .search-input":function (event) {
        if(event.keyCode==13){
            Router.go("/search/"+$(".search-input").val());
            $(".search-input").val("");
        }

    }
});

