import '../client/layout/masterLayout.html';
import '../client/personalCenter.html';
import '../client/search.html';
import '../client/topic.html';
Router.configure({
    layoutTemplate:'masterLayout'
});

Router.route('/personalCenter/:_id', function () {
    this.render("personalCenter",{
        data:function () {
            return Meteor.users.findOne({_id:this.params._id});
        }
    });
    this.render("header",{
        to:'personalInformationHead',
        data:function () {
            return Meteor.users.findOne({_id:this.params._id});
        }
    });
    this.render("left",{
        to:"left"
    });
},{
    name:'personalCenter'
});

Router.route('/',function () {
    this.render("index");
    this.render("left",{
        to:"left"
    });
});

Router.route('/search/:searchContext',function () {
    this.render("searchContext");
});

Router.route('/search/',function () {
    this.render("searchContext");
});

Router.route('/topic/',function () {
   this.render('topic');
});

Router.route('/topic/:topicID',function () {
    this.render("topicItem");
});
