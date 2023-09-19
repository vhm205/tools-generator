let { ACCOUNT_COLL }    = require('../packages/account');
let { sendMessage }     = require('./push-noti.cloudmessaging');

/**
 * Chức năng gửi noti từ cloud messaging
 * @param {*} title
 * @param {*} message
 * @param {*} receiversID
 * @param {*} body
 * @param {*} senderID
 */
function sendMessageMobile({ title, message, receiversID, body, senderID }){
    return new Promise(async resolve => {
        let fcmTokens = [];

        for (const receiverID of receiversID){
            if(receiverID.toString() !== senderID.toString()){
                let infoUser = await ACCOUNT_COLL.findById(receiverID).select('devices');
                if(!infoUser) return resolve({ error: true, message: 'Không tìm thấy tài khoản' });

                let devices = infoUser.devices;
                if(devices && devices.length){
                    const listFCMTokens = devices.map(item => item.fcmToken);
                    fcmTokens = [...fcmTokens, ...listFCMTokens];
                }
            }
        }

        sendMessage({ title, message, fcmTokens, body })
            .then(resultSendMessage => resolve(resultSendMessage))
            .catch(err => resolve(err))
    })
}

exports.sendMessageMobile = sendMessageMobile;

// ----------------PLAYGROUND-------------------//
// let arrReceiverID = ['60ab5729b436165fe06fd141'];
// let title = 'HELLO WORLD - K360';
// let description = 'CHAY NGAY DI';
// let senderID = 'KHANHNEY'
// let body = {
//     screen_key: 'Setting',
//     sender: senderID,
//     transactionID: 'abc'
// };

// sendMessageMobile({ title, description, arrReceiverID, senderID, body })