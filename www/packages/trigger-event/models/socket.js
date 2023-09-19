"use strict";

/**
 * EXTERNAL PACKAGE
 */
const io                        = require('socket.io-client');

/**
 * INTERNAL PACKAGE
 */
const { host_product }          = require('../../../config/cf_mode');

/**
 * CONSTANTS
 */

/**
 * MODULE
 */

/**
 * MODELS, COLLECTIONS
 */
const { ACCOUNT_MODEL }         = require('../../account');


class Model {
    constructor() {
        let socket_url = null;

        if(host_product) {
            socket_url = 'https://ldk.software.com';
        } else{
            socket_url = 'http://localhost:5005';
        }

        this.SOCKET_URL = socket_url;
    }

    /**
     * Send socket
     * @param {string} sockeName
     * @param {object} data
     * @this {Model}
     * @returns {Promise}
     */
    sendSocket({ socketName, body }){
        return new Promise(async resolve => {
            try {
                let infoUserAfterFakeSignin = await ACCOUNT_MODEL.loginNormal({ 
					account: process.env.ACCOUNT_AUTH_SOCKET_USR, 
					password: process.env.ACCOUNT_AUTH_SOCKET_PWD 
				});

				if (infoUserAfterFakeSignin.error)
					return console.log({ error: true, message: 'Tài khoản không tồn tại' });

				let socketURL = `${this.SOCKET_URL}?token=${infoUserAfterFakeSignin.data.token}`;
				socket = io(socketURL, { transports: ['websocket'], upgrade: false });

				console.log({ __mark: 'ASYNC', __connected: socket.connected, socket_url: socketURL });

				socket.on('connect', function() {
					console.log({ __mark: 'CONNECT_EVENT', __connected: socket.connected, socket_url: socketURL });

					if(socket && socket.connected && socketName){
						console.log('check connected', socket.connected, socketName);
						socket.emit(socketName, body);
						socket.disconnect();
					}
				});

				socket.on("connect_error", (err) => {
					console.log(`connect_error due to ${err.message}`);
				});

				socket.on("error", (err) => {
					console.log(`error due to ${err.message}`);
				});

                return resolve({ error: false, message: 'Send socket success!!' });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

}

module.exports.MODEL = new Model;
