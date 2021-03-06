Template.postEdit.events({
	'submit form': function(e) {
		e.preventDefault();
		var currentPostId = this._id;
		var postProperties = {
			url: $(e.target).find('[name=url]').val(),
			title: $(e.target).find('[name=title]').val()
		}
		var errors = validatePost(postProperties);
		if (errors.title || errors.url)
			return Session.set('postEditErrors', errors);
		Meteor.call('postUpdate', postProperties, currentPostId, function(error, result) {
		// 显示错误信息并退出
		if (error)
			return throwError(error.reason);
		if (result.postExists)
			throwError('This link has already been posted');
		Router.go('postPage', {_id: result._id});
		});
	},
	'click .delete': function(e) {
		e.preventDefault();
		if (confirm("Delete this post?")) {
			var currentPostId = this._id;
			Posts.remove(currentPostId);
			Router.go('postsList');
		}
	}
});

Template.postEdit.onCreated(function() {
	Session.set('postEditErrors', {});
});
Template.postEdit.helpers({
	errorMessage: function(field) {
		return Session.get('postEditErrors')[field];
	},
	errorClass: function (field) {
		return !!Session.get('postEditErrors')[field] ? 'has-error' : '';
	}
})

