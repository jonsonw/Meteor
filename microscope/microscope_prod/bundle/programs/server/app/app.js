var require = meteorInstall({"lib":{"permissions.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                //
// lib/permissions.js                                                                             //
//                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                  //
// check that the userId specified owns the documents                                             //
ownsDocument = function ownsDocument(userId, doc) {                                               // 2
	return doc && doc.userId === userId;                                                             // 3
};                                                                                                // 4
////////////////////////////////////////////////////////////////////////////////////////////////////

},"router.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                //
// lib/router.js                                                                                  //
//                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                  //
Router.configure({                                                                                // 1
	layoutTemplate: 'layout',                                                                        // 2
	loadingTemplate: 'loading',                                                                      // 3
	notFoundTemplate: 'notFound',                                                                    // 4
	waitOn: function waitOn() {                                                                      // 5
		return Meteor.subscribe('posts');                                                               // 6
	}                                                                                                // 7
});                                                                                               // 1
                                                                                                  //
Router.route('/', { name: 'postsList' });                                                         // 10
Router.route('/posts/:_id', {                                                                     // 11
	name: 'postPage',                                                                                // 12
	waitOn: function waitOn() {                                                                      // 13
		return Meteor.subscribe('comments', this.params._id);                                           // 14
	},                                                                                               // 15
	data: function data() {                                                                          // 16
		return Posts.findOne(this.params._id);                                                          // 16
	}                                                                                                // 16
});                                                                                               // 11
                                                                                                  //
var requireLogin = function requireLogin() {                                                      // 19
	if (!Meteor.user()) {                                                                            // 20
		if (Meteor.loggingIn()) {                                                                       // 21
			this.render(this.loadingTemplate);                                                             // 22
		} else {                                                                                        // 23
			this.render('accessDenied');                                                                   // 24
		}                                                                                               // 25
	} else {                                                                                         // 26
		this.next();                                                                                    // 27
	}                                                                                                // 28
};                                                                                                // 29
                                                                                                  //
Router.route('/posts/:_id/edit', {                                                                // 31
	name: 'postEdit',                                                                                // 32
	data: function data() {                                                                          // 33
		return Posts.findOne(this.params._id);                                                          // 33
	}                                                                                                // 33
});                                                                                               // 31
                                                                                                  //
Router.route('/submit', { name: 'postSubmit' });                                                  // 36
Router.onBeforeAction('dataNotFound', { only: 'postPage' });                                      // 37
Router.onBeforeAction(requireLogin, { only: 'postSubmit' });                                      // 38
////////////////////////////////////////////////////////////////////////////////////////////////////

}},"collections":{"comments.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                //
// collections/comments.js                                                                        //
//                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                  //
Comments = new Mongo.Collection('comments');                                                      // 1
                                                                                                  //
Meteor.methods({                                                                                  // 3
	commentInsert: function commentInsert(commentAttributes) {                                       // 4
		check(this.userId, String);                                                                     // 5
		check(commentAttributes, {                                                                      // 6
			postId: String,                                                                                // 7
			body: String                                                                                   // 8
		});                                                                                             // 6
		var user = Meteor.user();                                                                       // 10
		var post = Posts.findOne(commentAttributes.postId);                                             // 11
		if (!post) throw new Meteor.Error('invalid-comment', 'You must comment on a post');             // 12
		comment = _.extend(commentAttributes, {                                                         // 14
			userId: user._id,                                                                              // 15
			author: user.username,                                                                         // 16
			submitted: new Date()                                                                          // 17
		});                                                                                             // 14
		// 更新帖子的评论数                                                                                     //
		Posts.update(comment.postId, { $inc: { commentsCount: 1 } });                                   // 20
		return Comments.insert(comment);                                                                // 21
	}                                                                                                // 22
});                                                                                               // 3
////////////////////////////////////////////////////////////////////////////////////////////////////

},"posts.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                //
// collections/posts.js                                                                           //
//                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                  //
Posts = new Mongo.Collection('posts');                                                            // 1
                                                                                                  //
Posts.allow({                                                                                     // 3
	//update: function(userId, post) { return ownsDocument(userId, post); },                         //
	remove: function remove(userId, post) {                                                          // 5
		return ownsDocument(userId, post);                                                              // 5
	}                                                                                                // 5
});                                                                                               // 3
                                                                                                  //
/*                                                                                                //
Posts.deny({                                                                                      //
	update: function(userId, post, fieldNames) {                                                     //
	// 只能更改如下两个字段：                                                                                   //
		return (_.without(fieldNames, 'url', 'title').length > 0);                                      //
	}                                                                                                //
});                                                                                               //
*/                                                                                                //
Meteor.methods({                                                                                  // 16
	postInsert: function postInsert(postAttributes) {                                                // 17
		check(Meteor.userId(), String);                                                                 // 18
		check(postAttributes, {                                                                         // 19
			title: String,                                                                                 // 20
			url: String                                                                                    // 21
		});                                                                                             // 19
		/*                                                                                              //
  if (Meteor.isServer) {                                                                          //
  	postAttributes.title += "(server)";                                                            //
  	// wait for 5 seconds                                                                          //
  	Meteor._sleepForMs(5000);                                                                      //
  } else {                                                                                        //
  	postAttributes.title += "(client)";                                                            //
  }                                                                                               //
  */                                                                                              //
		var errors = validatePost(postAttributes);                                                      // 32
		if (errors.title || errors.url) throw new Meteor.Error('invalid-post', "你必须为你的帖子填写标题和 URL");    // 33
		var postWithSameLink = Posts.findOne({ url: postAttributes.url });                              // 35
		if (postWithSameLink) {                                                                         // 36
			return {                                                                                       // 37
				postExists: true,                                                                             // 38
				_id: postWithSameLink._id                                                                     // 39
			};                                                                                             // 37
		}                                                                                               // 41
		var user = Meteor.user();                                                                       // 42
		var post = _.extend(postAttributes, {                                                           // 43
			userId: user._id,                                                                              // 44
			author: user.username,                                                                         // 45
			submitted: new Date(),                                                                         // 46
			commentsCount: 0                                                                               // 47
		});                                                                                             // 43
		var postId = Posts.insert(post);                                                                // 49
		return {                                                                                        // 50
			_id: postId                                                                                    // 51
		};                                                                                              // 50
	},                                                                                               // 53
	postUpdate: function postUpdate(postAttributes, currentPostId) {                                 // 54
		check(Meteor.userId(), String);                                                                 // 55
		check(postAttributes, {                                                                         // 56
			title: String,                                                                                 // 57
			url: String                                                                                    // 58
		});                                                                                             // 56
		var errors = validatePost(postAttributes);                                                      // 60
		if (errors.title || errors.url) throw new Meteor.Error('invalid-post', "你必须为你的帖子填写标题和 URL");    // 61
		var postWithSameLink = Posts.findOne({ url: postAttributes.url, _id: { $ne: currentPostId } });
		if (postWithSameLink) {                                                                         // 64
			return {                                                                                       // 65
				postExists: true,                                                                             // 66
				_id: postWithSameLink._id                                                                     // 67
			};                                                                                             // 65
		}                                                                                               // 69
		var user = Meteor.user();                                                                       // 70
		var post = _.extend(postAttributes, {                                                           // 71
			userId: user._id,                                                                              // 72
			author: user.username,                                                                         // 73
			submitted: new Date()                                                                          // 74
		});                                                                                             // 71
		Posts.update(currentPostId, post);                                                              // 76
		return {                                                                                        // 77
			_id: currentPostId                                                                             // 78
		};                                                                                              // 77
	}                                                                                                // 80
});                                                                                               // 16
                                                                                                  //
validatePost = function validatePost(post) {                                                      // 83
	var errors = {};                                                                                 // 84
	if (!post.title) errors.title = "请填写标题";                                                         // 85
	if (!post.url) errors.url = "请填写 URL";                                                           // 87
	return errors;                                                                                   // 89
};                                                                                                // 90
////////////////////////////////////////////////////////////////////////////////////////////////////

}},"server":{"fixtures.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                //
// server/fixtures.js                                                                             //
//                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                  //
// Fixture data                                                                                   //
if (Posts.find().count() === 0) {                                                                 // 2
  var now = new Date().getTime();                                                                 // 3
  // create two users                                                                             //
  var tomId = Meteor.users.insert({                                                               // 5
    profile: { name: 'Tom Coleman' }                                                              // 6
  });                                                                                             // 5
  var tom = Meteor.users.findOne(tomId);                                                          // 8
  var sachaId = Meteor.users.insert({                                                             // 9
    profile: { name: 'Sacha Greif' }                                                              // 10
  });                                                                                             // 9
  var sacha = Meteor.users.findOne(sachaId);                                                      // 12
  var telescopeId = Posts.insert({                                                                // 13
    title: 'Introducing Telescope',                                                               // 14
    userId: sacha._id,                                                                            // 15
    author: sacha.profile.name,                                                                   // 16
    url: 'http://sachagreif.com/introducing-telescope/',                                          // 17
    submitted: new Date(now - 7 * 3600 * 1000),                                                   // 18
    commentsCount: 2                                                                              // 19
  });                                                                                             // 13
  Comments.insert({                                                                               // 21
    postId: telescopeId,                                                                          // 22
    userId: tom._id,                                                                              // 23
    author: tom.profile.name,                                                                     // 24
    submitted: new Date(now - 5 * 3600 * 1000),                                                   // 25
    body: 'Interesting project Sacha, can I get involved?'                                        // 26
  });                                                                                             // 21
  Comments.insert({                                                                               // 28
    postId: telescopeId,                                                                          // 29
    userId: sacha._id,                                                                            // 30
    author: sacha.profile.name,                                                                   // 31
    submitted: new Date(now - 3 * 3600 * 1000),                                                   // 32
    body: 'You sure can Tom!'                                                                     // 33
  });                                                                                             // 28
  Posts.insert({                                                                                  // 35
    title: 'Meteor',                                                                              // 36
    userId: tom._id,                                                                              // 37
    author: tom.profile.name,                                                                     // 38
    url: 'http://meteor.com',                                                                     // 39
    submitted: new Date(now - 10 * 3600 * 1000),                                                  // 40
    commentsCount: 0                                                                              // 41
  });                                                                                             // 35
  Posts.insert({                                                                                  // 43
    title: 'The Meteor Book',                                                                     // 44
    userId: tom._id,                                                                              // 45
    author: tom.profile.name,                                                                     // 46
    url: 'http://themeteorbook.com',                                                              // 47
    submitted: new Date(now - 12 * 3600 * 1000),                                                  // 48
    commentsCount: 0                                                                              // 49
  });                                                                                             // 43
}                                                                                                 // 51
////////////////////////////////////////////////////////////////////////////////////////////////////

},"publications.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                //
// server/publications.js                                                                         //
//                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                  //
Meteor.publish('posts', function () {                                                             // 1
	return Posts.find();                                                                             // 2
});                                                                                               // 3
                                                                                                  //
Meteor.publish('comments', function (postId) {                                                    // 5
	check(postId, String);                                                                           // 6
	return Comments.find({ postId: postId });                                                        // 7
});                                                                                               // 8
////////////////////////////////////////////////////////////////////////////////////////////////////

},"qiniu.js":function(require){

////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                //
// server/qiniu.js                                                                                //
//                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                  //
qiniu = Npm.require("qiniu");                                                                     // 1
                                                                                                  //
QN = {                                                                                            // 3
    config: {}                                                                                    // 4
};                                                                                                // 3
                                                                                                  //
Meteor.startup(function () {                                                                      // 7
    var has_ak = _.has(QN.config, "access_key") && QN.config.access_key;                          // 8
    var has_sk = _.has(QN.config, "secret_key") && QN.config.secret_key;                          // 9
    var has_bn = _.has(QN.config, "bucket_name") && QN.config.bucket_name;                        // 10
    var has_dn = _.has(QN.config, "domain_name") && QN.config.domain_name;                        // 11
                                                                                                  //
    if (!has_ak) {                                                                                // 13
        console.log("QN: Qiniu access key is undefined");                                         // 14
    }                                                                                             // 15
                                                                                                  //
    if (!has_sk) {                                                                                // 17
        console.log("QN: Qiniu secret key is undefined");                                         // 18
    }                                                                                             // 19
                                                                                                  //
    if (!has_bn) {                                                                                // 21
        console.log("QN: Qiniu bucket name is undefined");                                        // 22
    }                                                                                             // 23
                                                                                                  //
    if (!has_dn) {                                                                                // 25
        console.log("QN: Qiniu domain name is undefined");                                        // 26
    }                                                                                             // 27
                                                                                                  //
    if (!has_ak || !has_sk || !has_bn || !has_dn) {                                               // 29
        return;                                                                                   // 30
    }                                                                                             // 31
                                                                                                  //
    qiniu.conf.ACCESS_KEY = QN.config.access_key;                                                 // 33
    qiniu.conf.SECRET_KEY = QN.config.secret_key;                                                 // 34
    console.log("QN: Qiniu config is successfully defined!");                                     // 35
});                                                                                               // 37
////////////////////////////////////////////////////////////////////////////////////////////////////

},"startup.js":function(require){

////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                //
// server/startup.js                                                                              //
//                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                  //
qiniu = Npm.require("qiniu");                                                                     // 1
                                                                                                  //
QN = {                                                                                            // 3
    config: {}                                                                                    // 4
};                                                                                                // 3
                                                                                                  //
QN.config = {                                                                                     // 7
    access_key: '4WhOe0LAHRrQ9lK68HuNfUlqD-yL2SK0DWstqBQd',                                       // 8
    secret_key: 'xEB9y7lWOnEuQD-_XR-2tM7hCrof30qV8AKbZDzJ',                                       // 9
    bucket_name: 'lzzh',                                                                          // 10
    domain_name: 'od2m9k330.bkt.clouddn.com'                                                      // 11
};                                                                                                // 7
                                                                                                  //
Meteor.startup(function () {                                                                      // 14
    var has_ak = _.has(QN.config, "access_key") && QN.config.access_key;                          // 15
    var has_sk = _.has(QN.config, "secret_key") && QN.config.secret_key;                          // 16
    var has_bn = _.has(QN.config, "bucket_name") && QN.config.bucket_name;                        // 17
    var has_dn = _.has(QN.config, "domain_name") && QN.config.domain_name;                        // 18
                                                                                                  //
    if (!has_ak) {                                                                                // 20
        console.log("QN: Qiniu access key is undefined");                                         // 21
    }                                                                                             // 22
                                                                                                  //
    if (!has_sk) {                                                                                // 24
        console.log("QN: Qiniu secret key is undefined");                                         // 25
    }                                                                                             // 26
                                                                                                  //
    if (!has_bn) {                                                                                // 28
        console.log("QN: Qiniu bucket name is undefined");                                        // 29
    }                                                                                             // 30
                                                                                                  //
    if (!has_dn) {                                                                                // 32
        console.log("QN: Qiniu domain name is undefined");                                        // 33
    }                                                                                             // 34
                                                                                                  //
    if (!has_ak || !has_sk || !has_bn || !has_dn) {                                               // 36
        return;                                                                                   // 37
    }                                                                                             // 38
                                                                                                  //
    qiniu.conf.ACCESS_KEY = QN.config.access_key;                                                 // 40
    qiniu.conf.SECRET_KEY = QN.config.secret_key;                                                 // 41
    console.log("QN: Qiniu config is successfully defined!");                                     // 42
});                                                                                               // 44
////////////////////////////////////////////////////////////////////////////////////////////////////

},"utils.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                //
// server/utils.js                                                                                //
//                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                  //
                                                                                                  //
var wrappedPutFile = Meteor.wrapAsync(qiniu.io.putFile, qiniu.io);                                // 2
                                                                                                  //
Meteor.methods({                                                                                  // 4
    qn_uptoken: function qn_uptoken() {                                                           // 5
        var bucket_name = QN.config.bucket_name;                                                  // 6
        var putPolicy = new qiniu.rs.PutPolicy(bucket_name);                                      // 7
        return putPolicy.token();                                                                 // 8
    },                                                                                            // 9
                                                                                                  //
    qn_delete: function qn_delete(key) {                                                          // 11
        check(key, String);                                                                       // 12
        console.log("server delete call");                                                        // 13
        var client = new qiniu.rs.Client();                                                       // 14
        var bucketName = QN.config.bucket_name;                                                   // 15
        client.remove(bucketName, key, function (err, ret) {                                      // 16
            if (!err) {} else {                                                                   // 17
                console.log(err);                                                                 // 20
            }                                                                                     // 21
        });                                                                                       // 22
    },                                                                                            // 23
                                                                                                  //
    qn_upload: function qn_upload(file, key) {                                                    // 25
        // check(file, Object);                                                                   //
                                                                                                  //
        var extra = new qiniu.io.PutExtra();                                                      // 28
        var uptoken = Meteor.call('qn_uptoken');                                                  // 29
        console.log("extra: " + extra);                                                           // 30
        console.log("uptoken: " + uptoken);                                                       // 31
                                                                                                  //
        // server side file is empty                                                              //
        console.log("server file: ");                                                             // 34
        console.log(file);                                                                        // 35
        console.log("key: " + key);                                                               // 36
                                                                                                  //
        wrappedPutFile(uptoken, key, file, extra);                                                // 38
    }                                                                                             // 40
});                                                                                               // 4
////////////////////////////////////////////////////////////////////////////////////////////////////

}}},{"extensions":[".js",".json"]});
require("./lib/permissions.js");
require("./lib/router.js");
require("./collections/comments.js");
require("./collections/posts.js");
require("./server/fixtures.js");
require("./server/publications.js");
require("./server/qiniu.js");
require("./server/startup.js");
require("./server/utils.js");
//# sourceMappingURL=app.js.map
