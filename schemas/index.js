const mongoose = require('mongoose');

const { MONGO_ID, MONGO_PASSWORD, NODE_ENV } = process.env;
const MONGO_URL = `mongodb://${MONGO_ID}:${MONGO_PASSWORD}@localhost:27017/admin`;

module.exports = () => {
    const connect = () => {
        if (NODE_ENV !== 'production') {
            mongoose.set('debug', true);
        }
        mongoose.connect(MONGO_URL, {
            dbName: 'gifchat',
        }, (error) => {
            if(error) {
                console.log('Mongo DB Connection Err : ', error);
            } else {
                console.log('Mongo DB connection Complete');
            }
        });
    };
    connect();

    mongoose.connection.on('error', (error) => {
        console.error('Mongo DB Connection Err : ', error);
    });

    mongoose.connection.on('disconnected', () => {
        console.error('Mongo DB Disconnected');
        connect();
    });

    require('./chat');
    require('./room');
};