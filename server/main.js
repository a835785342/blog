import {Meteor} from 'meteor/meteor';
import '../collections/blog.js';
import {topics} from "../collections/topic.js";
import {Accounts} from 'meteor/accounts-base';

const fs = require('fs');
Meteor.startup(() => {

});

Meteor.methods({
    writeFile: function (url, data, userID) {
        //判断是否存在userID这个目录
        if (!fs.exists("E:\\blog\\public\\imgs\\" + userID, function (exits) {
            console.log(exits ? "" : userID + "目录不存在，准备创建。");
        })) {
            fs.mkdir("E:\\blog\\public\\imgs\\" + userID, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log(userID + "用户目录创建成功");
                }
            })
        }
        fs.writeFile(url, data, "binary", function (err) {
            if (err) console.log('写入文件失败！' + err);
            else console.log('写入文件成功！');
        })
    },
    deleteFile: function (url) {
        fs.unlink("E:\\blog\\public" + url, function (err) {
            if (err) {
                console.log(err);
            } else {
                console.log(url + "图片删除成功");
            }
        })
    },
    readFile: function (url) {
        var result = fs.readFileSync("E:\\blog\\public" + url, "base64");
        var suffixFileName = url.substring(url.lastIndexOf('.') + 1, url.length);
        if (suffixFileName == "jpg") {
            return "data:image/jpeg;base64," + result;
        } else {
            return "data:image/" + suffixFileName + ";base64," + result;
        }

    },
    upsertTopic: function (blogContext, blogID) {
        const re = /(?<=#).+?(?=#)/g;
        const topicName = re.exec(blogContext);
        const time = new Date();
        if (topicName[0] != undefined) {
            if (topics.findOne({name: topicName[0]}) === undefined) {
                var ablogID = new Array(blogID);
                topics.insert({
                    name: topicName[0],
                    hostID: Meteor.userId(),
                    hostName: Meteor.user().username,
                    ablogID: ablogID,
                    createTime: time,
                    candidatePerson: new Array()
                })
            } else {
                topics.update({name: topicName[0]}, {$push: {'ablogID': blogID}});
            }
        }

    },
    deleteTopic: function (blogContext, blogID) {
        const re = /(?<=#).+?(?=#)/g;
        const topicName = re.exec(blogContext);
        if (topicName[0] != undefined) {
            topics.update({name: topicName[0]}, {$pull: {ablogID: blogID}});
            const topic = topics.findOne({name: topicName[0]});
            if (topic.ablogID.length == 0) {
                topics.remove({name: topicName[0]});
                console.log("删除话题" + topicName[0] + "成功！");
            }
        }

    },
    findUser: function () {
        return Meteor.users.find({}).fetch();
    }

});

//创建用户时自动填充头像
Accounts.onCreateUser(function (options, user) {
    user.profile = options.profile;
    return user;
});

Accounts.validateLoginAttempt(function (options) {
    if (options.user === undefined || options.user === null) {
        throw new Meteor.Error("error", "找不到此用户");
    } else if (options.user.profile.status != 'normal') {

        throw new Meteor.Error("error", "你账号已被停封");
    } else {
        return true;
    }
});

Meteor.users.allow({
    update: function () {
        return true;
    },
    remove: function () {
        return true;
    }
});

Meteor.publish('users', function () {
    return Meteor.users.find({}, {fields: {emails: true}});
});


