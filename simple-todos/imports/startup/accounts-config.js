import {Accounts} from 'meteor/accounts-base';

Accounts.ui.config({
	passwordSignupFields:'USERNAME_ONLY',
});

T9n.map "zh_CN", zh_CN;