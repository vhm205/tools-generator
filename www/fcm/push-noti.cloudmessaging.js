let FCM             = require('fcm-notification');
let K360_CONFIG_FCM = require('./k360-50b87-firebase-adminsdk-erii4-51505a5476.json');
let fcm             = new FCM(K360_CONFIG_FCM);

exports.sendMessage = function ({ title, message, fcmTokens, body }) {
	console.log(`run: sendMessage...........`)
	return new Promise(resolve => {
		let tokens 	= Array.isArray(fcmTokens) ? fcmTokens : [fcmTokens];
		let row 	= body ? JSON.stringify(body) : '';

		if(!title){
			title = 'LDK SOFTWARE - GIẢI PHÁP PHẦN MỀM';
		}
		let dataSend = {
			data: {
				row: row
			},
			notification: {
				title,
				body: message
			}
		};

		fcm.sendToMultipleToken(dataSend, tokens, function (err, response) {
			if (err) {
				return resolve(({
					error: true,
					message: err
				}));
			}

			return resolve({
				error: false,
				message: response
			});
		});
	})
}

// let tokenNguyen = 'dICILntvRsakamlOZzuyrA:APA91bGClrDjieiWJYJ_49sWyd7fWE6RLg3vTysSiiQJXL1pcoeOFjfq1E49-Hg2mqY2YbrCcC4lSGOanqoZuJqtQwH3pSjiOk2ZyjtxbsikgkmZ6FI6t0H6jjtBijSAStau4DnYViPY';
// let body = { 
// 	screen_key: 'ImageDealScreen',
// 	sender: 'KHANHNEY'
// }
// sendMessage({ title: 'K360 - EVERYONE', description:'HELLO NGUYEN', arrayRegistrationID: tokenNguyen, body })
// 	.then(result => console.log({ result }))
// 	.catch(err => console.log({ err }))