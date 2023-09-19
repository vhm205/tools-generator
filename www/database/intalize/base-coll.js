"use strict";

const DATABASE 	= require('./db_connect');
const Schema 	= require('mongoose').Schema;
const random 	= require('mongoose-simple-random');

module.exports = function (dbName, dbOb) {
	dbOb.createAt   = Date;
    dbOb.modifyAt   = Date;
    dbOb.state 		= { type: Number, enum: [1,2], default: 1 };
    dbOb.author     = { type: Schema.Types.ObjectId, ref: 'user' };
    dbOb.userUpdate = { type: Schema.Types.ObjectId, ref: 'user' };

    let s = new Schema(dbOb);
    s.plugin(random);

    return DATABASE.model(dbName, s);
};