Posts = new Mongo.Collection('posts');

Posts.allow({
	//update: function(userId, post) { return ownsDocument(userId, post); },
	remove: function(userId, post) { return ownsDocument(userId, post); }
});

/*
Posts.deny({
	update: function(userId, post, fieldNames) {
	// 只能更改如下两个字段：
		return (_.without(fieldNames, 'url', 'title').length > 0);
	}
});
*/
Meteor.methods({
	postInsert: function(postAttributes) {
		check(Meteor.userId(), String);
		check(postAttributes, {
			title: String,
			url: String
		});
		/*
		if (Meteor.isServer) {
			postAttributes.title += "(server)";
			// wait for 5 seconds
			Meteor._sleepForMs(5000);
		} else {
			postAttributes.title += "(client)";
		}
		*/
		var errors = validatePost(postAttributes);
		if (errors.title || errors.url)
			throw new Meteor.Error('invalid-post', "你必须为你的帖子填写标题和 URL");
		var postWithSameLink = Posts.findOne({url: postAttributes.url});
		if (postWithSameLink) {
			return {
				postExists: true,
				_id: postWithSameLink._id
			}
		}
		var user = Meteor.user();
		var post = _.extend(postAttributes, {
			userId: user._id,
			author: user.username,
			submitted: new Date(),
			commentsCount: 0
		});
		var postId = Posts.insert(post);
		return {
			_id: postId
		};
	},
	postUpdate: function(postAttributes,currentPostId){
		check(Meteor.userId(), String);
		check(postAttributes, {
			title: String,
			url: String
		});
		var errors = validatePost(postAttributes);
		if (errors.title || errors.url)
			throw new Meteor.Error('invalid-post', "你必须为你的帖子填写标题和 URL");
		var postWithSameLink = Posts.findOne({url: postAttributes.url,_id:{$ne:currentPostId}});
		if (postWithSameLink) {
			return {
				postExists: true,
				_id: postWithSameLink._id
			}
		}
		var user = Meteor.user();
		var post = _.extend(postAttributes, {
			userId: user._id,
			author: user.username,
			submitted: new Date()
		});
		Posts.update(currentPostId,post);
		return {
			_id: currentPostId
		};
	}
});

validatePost = function (post) {
	var errors = {};
	if (!post.title)
		errors.title = "请填写标题";
	if (!post.url)
		errors.url = "请填写 URL";
	return errors;
}