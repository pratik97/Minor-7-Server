/**
 * Created by Pratik on 11/1/2017.
 */

var mongoose = require('mongoose'),
    Schema = mongoose.Schema

var ChatSchema = new Schema({
    person1Id: {
        type: Schema.ObjectId,
        required: [true, 'Who is Person 1 for this chat']
    },
    person2Id: {
        type: Schema.ObjectId,
        required: [true, 'Who is Person 2 for this chat']
    },
    messages: [{
        timeStamp: String,
        senderId: String,
        message: String
    }]
});

var Chat = mongoose.model('Chat',ChatSchema);
module.exports = {
    Chat: Chat
};