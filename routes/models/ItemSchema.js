/**
 * Created by Pratik on 8/28/2017.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    bcrypt = require('bcryptjs'),
    SALT_WORK_FACTOR = 10;


var ItemSchema = new Schema({
    userId: {
        type: Schema.ObjectId,
        required: [true, 'Who owns this item? give the user Id']
    },
    itemName: {
        type: String,
        required: [true, ' Item name is not given']
    },
    itemImageUrl: {
        type: String
    },
    itemBranch: {
        type: String,
        required: [true, 'Item Branch is not given ']
    },
    itemSaleStatus: {
        type: Boolean,
        required: [true, 'Item Sale Status is not given']
    }


})
var Item = mongoose.model('Item', ItemSchema);
module.exports = {
    Item: Item
};
