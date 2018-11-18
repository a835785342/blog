import moment from "moment";
import {Template} from "meteor/templating";
import {Session} from "meteor/session";
import {_} from "meteor/underscore";
import * as toastr from "toastr";
import "emojionearea/dist/emojionearea.js";
Template.searchContext.onRendered(function () {
    $("#search-modal-blogContext").emojioneArea({
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
        var searchContext=Router.current().params.searchContext;
        var blog = blogs.find({blogContext:{$regex:searchContext,$options:'i'}}, {sort: {createTime: -1}}).fetch();
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
        // $("#search-modal-blogContext").text(updateBlogContent.blogContext);

        $("#search-modal-blogContext")[0].emojioneArea.setText(updateBlogContent.blogContext);
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

        const blogContext = $("#search-modal-blogContext").val();
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