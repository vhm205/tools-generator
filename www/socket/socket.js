"use strict";

let redis                           = require('redis');
let redisAdapter                    = require('socket.io-redis');
let { REDIS_SEPERATOR }             = require('../config/cf_redis');

// tạo GlobalStore -> lưu trữ danh sách user đang online (nhận được socketIO)
let usersConnectedInstance          = require('../config/cf_globalscope').GlobalStore;
let usersConnected                  = usersConnectedInstance.usersOnline;

/**
 * CONSTANTS
 */
let {
    CSS_TEST,
} = require('./constants');

/**
 * UTILS
 */
let { replaceExist }                = require('../utils/utils');
// let {
//     mapSocketIDAndData,
//     sendToClient,
//     getUserNotConnected
// } = require('../utils/socket_utils');
// let { sendMessageMobile }        = require('../fcm/utils');

/**
 * MODELS
 */
const ACCOUNT_MODEL = require('../packages/account/models/account').MODEL;

module.exports = function (io) {
    let pub = redis.createClient({
        // detect_buffers: true,
        // return_buffers: true,
        host: REDIS_SEPERATOR.HOST,
        port: REDIS_SEPERATOR.PORT,
        auth_pass: REDIS_SEPERATOR.PWD
    });

    let sub = redis.createClient({
        // detect_buffers: true,
        // return_buffers: true,
        host: REDIS_SEPERATOR.HOST,
        port: REDIS_SEPERATOR.PORT,
        auth_pass: REDIS_SEPERATOR.PWD
    });

    io.adapter(redisAdapter({
        pubClient: pub,
        subClient: sub
    }));

    io
    .set('transports', ['websocket']) //config
    .use(async (socket, next) => {
        socket.isAuth = false;
        console.log({ ["socket.handshake.query.token"]: socket.handshake.query });
        
        if (socket.handshake.query && socket.handshake.query.token) {
            let signalVerifyToken = await ACCOUNT_MODEL.checkAuthenticate({ 
                accessToken: socket.handshake.query.token
            });

            if (signalVerifyToken.error) {
                return next(new Error('Authentication error'));
            }

            let infoUser = signalVerifyToken;

            socket.decoded   = infoUser;
            socket.isAuth    = true;
            socket.tokenFake = false;

            /**
             * ADD USER INTO usersConnected
             */
            let { id: socketID } = socket;
            let { _id: userID, username } = infoUser;
            socket.userID = userID;

            let usersConnectedGlobal = usersConnectedInstance.usersOnline;

            console.log({
                [`thông tin trước khi connect`]: usersConnectedGlobal,
                [`số lượng`]: usersConnectedGlobal.length
            })

            usersConnected = replaceExist(usersConnectedGlobal, userID, socketID, username);

            console.log({
                [`danh sách SAU KHI user connected vào socket`]: usersConnected,
                [`số lượng`]: usersConnected.length
            })
            // console.log({
            //     [`thông tin trước khi connect`]: usersConnected,
            //     [`số lượng`]: usersConnected.length,
            //     [`Truy cập mới`]: {
            //         userID, socketID, username
            //     }
            // })

            usersConnectedInstance.setUsersOnline(usersConnected);
            next();
        }

    })
    .on('connection', function (socket) {
        const { id: socketID, decoded, isAuth } = socket;
        console.log({ 'connection - socket ID:': socketID, isAuth, decoded });

        if (isAuth) {
            socket.on(CSS_TEST, async data => {
                let { message } = data;

                console.log({ message });
                // mapSocketIDAndData(listUserSendNotifi, SSC_TEST, {
                //     message
                // }, usersConnected, io);

                /**
                 * Lấy danh sách user not connected
                 */
                //  let listUserNotConnected = getUserNotConnected(usersConnected, listUserSendNotifi);

                //  let body = {
                //      screen_key: 'Setting',
                //      sender: userID,
                //      transactionID: transactionID
                //  };

                // sendMessageMobile({ title, description: content, arrReceiverID: listUserNotConnected, senderID: userID, body });
            })
        }

        socket.on('disconnect', function () {
            console.log(`Disconnected..., Socket ID: ${socket.id}`);
            /**
            * ADD USER INTO usersConnected
            * usersConnected
            */
           let { id: socketIDDisconnect, decoded } = socket;
           if (!decoded || !decoded._id) return;

           let { _id: userIDDisconnect } = decoded;
           
           let usersConnectedGlobal = usersConnectedInstance.usersOnline;

           let itemDisconnect = usersConnectedGlobal.find(itemSocket => itemSocket.userID == userIDDisconnect);

           console.log({
               [`thông tin trước khi disconnect`]: itemDisconnect,
               [`số lượng socketID trước khi disconnect`]: itemDisconnect && itemDisconnect.socketID && itemDisconnect.socketID.length
           })

           let listItemStillConnect = usersConnectedGlobal.filter(itemSocket => itemSocket.userID != userIDDisconnect);
           let listSocketIDOfItemDisconnectAfterRemoveSocketDisconnect = itemDisconnect && itemDisconnect.socketID.filter(socketID => socketID != socketIDDisconnect);

           let itemDisconnectAfterRemoveSocketID = {
               ...itemDisconnect, socketID: listSocketIDOfItemDisconnectAfterRemoveSocketDisconnect
           }
           let listUserConnectAfterRemoveSocketDisconnect = [
               ...listItemStillConnect, itemDisconnectAfterRemoveSocketID
           ]

           console.log({
               [`thông tin sau khi disconnect`]: itemDisconnectAfterRemoveSocketID,
               [`số lượng socketID sau khi disconnect`]: itemDisconnectAfterRemoveSocketID && itemDisconnectAfterRemoveSocketID.socketID && itemDisconnectAfterRemoveSocketID.socketID.length
           })

           usersConnectedInstance.setUsersOnline(listUserConnectAfterRemoveSocketDisconnect);
        })
    });
};
