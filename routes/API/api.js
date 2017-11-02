/**
 * Created by Pratik on 8/30/2017.
 */
// NPM modules
var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var ObjectId = require('mongodb').ObjectID;
var request = require('request');
var async = require('async');
var multer = require('multer');
var multerS3 = require('multer-s3');
var fs = require('fs');
var AWS = require('aws-sdk');


var crypto = require('crypto');
var cnf = require('../../config').env;
var cfg = require("../../config");
var URL = cfg.db.URL;
//Create All the Schemas Here...
var UserSchema = require("../models/UserSchema").User;
var ItemSchema = require("../models/ItemSchema").Item;
var ChatSchema = require("../models/ChatSchema").Chat;
//Entry Point Function to Check if Server is working
router.get('/', function (req, res, next) {
    res.send("Welcome to the Student Help Portal API here");
});


// POST login api
// Post variables = userName,password
// Response variables = response,success
router.post("/login", function (req, res, next) {
    // All variables
    var emailAddress = req.body.emailAddress;
    var password = req.body.password;
    console.log(emailAddress);
    console.log(password);
    // attempt to authenticate user
    UserSchema.getAuthenticated(emailAddress, password, function (err, user, reason) {
        if (err) {
            console.log(err);
            res.json({response: "Please try again!", success: "false", message: "Please Try Again!"});
            return;
        }

        // login was successful if we have a user
        if (user) {
            // handle login success
            console.log('login success');
            user = JSON.parse(JSON.stringify(user));
            var payload = {
                id: user._id
            };
            //var token = jwt.sign(payload, cfg.authJWT.jwtSecret);
            res.json({response: user, success: "true"});
            return;
        }

        // otherwise we can determine why we failed
        var reasons = UserSchema.failedLogin;
        switch (reason) {
            case reasons.NOT_FOUND:
            case reasons.PASSWORD_INCORRECT:
                res.json({
                    response: "Invalid Username or Password!",
                    success: "false",
                    message: "Invalid Username Or Password!"
                });
                break;
            case reasons.MAX_ATTEMPTS:
                // You could anything here like call him or send him a mail
                res.json({
                    response: "Locked",
                    success: "false",
                    message: "Due to many failed attempts, your account is locked! Try after some time!"
                });
                break;
        }
    });

});
// End of login api

//Change password API
// ------changePassword - POST - REQUEST - emailAddress, mobileNumber, oldpass, newpass
router.put('/changePassword', function (req, res, next) {

    var emailAddress = req.body.emailAddress;
    var mobileNumber = req.body.mobileNumber;
    var oldpass = req.body.oldpass;
    var newpass = req.body.newpass;

    console.log(emailAddress);
    console.log("HeyHet" + mobileNumber);
    console.log("HeyHet1" + oldpass);
    console.log("HeyHet2" + newpass);

    UserSchema.findOne({'mobileNumber': mobileNumber}, function (err, user) {
        if (err) {
            console.log(err);
            res.json({response: err, success: "false"});
            return;
        }
        if (!user) {
            res.json({
                response: "Your mobile number is not registered!",
                success: "false",
                message: "Your mobile number is not registered!"
            });
            return;
        }
        if (user.emailAddress != emailAddress) {
            res.json({
                response: "Your emailAddress is not registered with the mobile number",
                success: "false",
                message: "Your emailAddress is not registered with the mobile number"
            });
            return;
        }
        user.comparePassword(oldpass, function (err, isMatch) {
            if (err) return cb(err);

            // check if the password was a match
            if (isMatch) {
                user.password = newpass;
                user.save();
                res.json({
                    response: "Password has been Successfully changed!",
                    success: "true",
                    message: "Password has been Successfully changed!"
                });
                return;
            }
            else {

                res.json({
                    response: "Password provided is incorrect",
                    success: "false",
                    message: "Password provided is incorrect"
                });
                return;
            }

        });

    });


});
//POST signup API
//POST variable = username,password,gender,mobileNo,emailAddress,profileImageUrl,semester
// response variable = response,success
router.post("/signup", function (req, res, next) {
    var userName = req.body.userName;
    var password = req.body.password;
    var gender = req.body.gender;
    var mobileNumber = req.body.mobileNumber;
    var emailAddress = req.body.emailAddress;
    var profileImageUrl = req.body.profileImageUrl || "www.facebook.com";
    var semester = req.body.semester;


// Create a new schema for current user
    var AddUser = new UserSchema({
        userName: userName,
        password: password,
        gender: gender,
        emailAddress: emailAddress,
        mobileNumber: mobileNumber,
        profileImageUrl: profileImageUrl,
        semester: semester
    });

// Check the schema
    var error = AddUser.validateSync();
    if (error) {
        console.log(error);
        res.json({response: error, success: "false", message: "Please enter valid data!"});
        return;
    }
// Save through UserSchema
    AddUser.save(function (err) {
        if (err) {
            console.log(err.errmsg);
            var message = "";
            // Custom error message
            if (err.errmsg.includes('userName')) {
                message = "UserName already taken!";
            } else if (err.errmsg.includes('emailAddress')) {
                message = "This email-address has already been registered!";
            } else if (err.errmsg.includes('mobileNumber')) {
                message = "This mobile number has already been registered!";
            } else {
                message = "Please enter valid data!";
            }
            res.json({response: message, success: "false", message: message});
            return;
        }
        res.json({response: "User Added Successfully!", success: "true"});
    });
});
// End of signup api


// Store Chat Data API
// input: person1Id,person2Id, senderId, message
router.post('/storeChatData', function (req, res, next) {
    var person1Id = req.body.person1Id;
    var person2Id = req.body.person2Id;
    // var timeStamp =  window.performance && window.performance.now && window.performance.timing && window.performance.timing.navigationStart ? window.performance.now() + window.performance.timing.navigationStart : Date.now();
    // console.log(timeStamp, Date.now());
    var timeStamp = Date.now();
    console.log(timeStamp);
    var senderId = req.body.senderId;
    var message = req.body.message;
    var flag = true;
    var messageLen;
        ChatSchema.findOne({person1Id: person1Id , person2Id: person2Id}, function (err, result) {
            flag= false;
//case of error
            if (err || result==null) {
            var AddChat = new ChatSchema({

                person1Id: person1Id,
                person2Id: person2Id,
                messages: [{
                    timeStamp: timeStamp,
                    senderId: senderId,
                    message: message
                }]
            });
            var error = AddChat.validateSync();
            if (error) {
                console.log(error);
                res.json({response: error, success: "false", message: "These is not a valid Chat!"});
                return;
            }
            AddChat.save(function (err) {
                if (err) {
                    // console.log(err.errmsg);
                    var message = "this is not a valid Chat!";

                    res.json({response: message, success: "false", message: message});
                    return;
                }
                res.json({response: "Chat Added Successfully!", success: "true"});
            });
        }
        else {
            flag =true;
            messageLen = result.messages.length;
            console.log(messageLen);
            console.log("message = "+message);
            result.messages.push( {
                timeStamp: timeStamp,
                senderId: senderId,
                message: message
            });
            AddChat = ChatSchema(result);
            AddChat.save(function (err) {
                if (err) {
                    var message = "this is not a valid Chat!";

                    res.json({response: message, success: "false", message: message});
                    return;
                }
                res.json({response: "Chat Added Successfully!", success: "true"});
            });
        }
    });
        if(flag==true){
            ChatSchema.findOne({person1Id: person2Id , person2Id: person1Id}, function (err, result) {
                flag= false;
                if (err || result==null) {
                    var AddChat = new ChatSchema({

                        person1Id: person2Id,
                        person2Id: person1Id,
                        messages: [{
                            timeStamp: timeStamp,
                            senderId: senderId,
                            message: message
                        }]
                    });
                    var error = AddChat.validateSync();
                    if (error) {
                        console.log(error);
                        res.json({response: error, success: "false", message: "These is not a valid Chat!"});
                        return;
                    }
                    AddChat.save(function (err) {
                        if (err) {
                            // console.log(err.errmsg);
                            var message = "this is not a valid Chat!";

                            res.json({response: message, success: "false", message: message});
                            return;
                        }
                        res.json({response: "Chat Added Successfully!", success: "true"});
                    });
                }
                else {
                    flag =true;
                    messageLen = result.messages.length;
                    console.log(messageLen);
                    console.log("message = "+message);
                    result.messages.push( {
                        timeStamp: timeStamp,
                        senderId: senderId,
                        message: message
                    });
                    AddChat = ChatSchema(result);
                    AddChat.save(function (err) {
                        if (err) {
                            var message = "this is not a valid Chat!";

                            res.json({response: message, success: "false", message: message});
                            return;
                        }
                        res.json({response: "Chat Added Successfully!", success: "true"});
                    });
                }
            });
        }
})

//Sell Item
//Post Variables ItemName,ItemImageUrl,ItemBranch, ItemSellStatus, ItemCategory
router.post('/sellItem', function (req, res, next) {
    var userId = req.body.userId;
    var itemName = req.body.itemName;
    var itemImageUrl = req.body.itemImageUrl;
    var itemBranch = req.body.itemBranch;
    var itemSellStatus = req.body.itemSellStatus;
    var itemCategory = req.body.itemCategory;
    var itemPrice = req.body.itemPrice;
    var itemMessage = req.body.itemMessage;

    //Create a new Schema for Item
    var AddItem = new ItemSchema({
        userId: userId,
        itemName: itemName,
        itemImageUrl: itemImageUrl,
        itemBranch: itemBranch,
        itemSellStatus: itemSellStatus,
        itemCategory: itemCategory,
        itemPrice: itemPrice,
        itemMessage: itemMessage
    });
// Check the schema
    var error = AddItem.validateSync();
    if (error) {
        console.log(error);
        res.json({response: error, success: "false", message: "Please enter valid data!"});
        return;
    }
//Save to UserSchema
    AddItem.save(function (err) {
        if (err) {
            console.log(err.errmsg);
            var message = "Please Enter Valid Data";

            res.json({response: message, success: "false", message: message});
            return;
        }
        res.json({response: "Item Added Successfully!", success: "true"});
    });


});
//Retrieve Chat Data
router.post("/getChat",function (req,res,next) {
    var person1Id = req.body.person1Id;
    var person2Id = req.body.person2Id;
    console.log(person1Id+" "+person2Id);
    var flag=true;
    ChatSchema.findOne({person1Id: person1Id  , person2Id: person2Id},function (err,result) {

        if(err || result===null){
            res.json({success: 'false', response: err});
            return;
        }
        else{
            flag = false;
            var MyMessages=[];
            var UsersMessages=[];
            var k = result.messages;
            for( var i=0;i<k.length;i++){
                if(k[i].senderId == person1Id){
                    MyMessages.push(k[i].message);
                }
                else{
                    UsersMessages.push(k[i].message);
                }
            }
            console.log(MyMessages+" "+UsersMessages);
            var response = [MyMessages,UsersMessages];
            return res.send({success: 'true', response: response });
        }

    })
    if(flag==true){
        ChatSchema.findOne({person1Id: person2Id  , person2Id: person1Id},function (err,result) {

            if(err || result===null){
                res.json({success: 'false', response: err});
                return;
            }
            else{
                flag = false;
                var MyMessages=[];
                var UsersMessages=[];
                var k = result.messages;
                for( var i=0;i<k.length;i++){
                    if(k[i].senderId == person2Id){
                        MyMessages.push(k[i].message);
                    }
                    else{
                        UsersMessages.push(k[i].message);
                    }
                }
                console.log(MyMessages+" "+UsersMessages);
                var response = [MyMessages,UsersMessages];
                return res.send({success: 'true', response: response });
            }

        })

    }


})
//getUserName API POST
router.post("/getUserName", function (req, res, next) {
    var userId = req.body.userId;
    // var myId = req.body.myId;
    var userName = "";
    UserSchema.findOne({_id: userId}, function (err, result) {
        console.log(result);
        if (err || result === null) {
            res.json({success: 'false', response: err});
            return;
        }
        else {
            userName = result.userName;
            return res.send({success: 'true', response: userName});
        }
    });
});
router.get("/getAllItems", function (req, res, next) {
    ItemSchema.find({}, function (err, items) {
        var itemMap = {};
        items.forEach(function (item) {
            itemMap[item._id] = item;
        })
        res.send(itemMap);
    });
});

router.get("/getItemsForSale", function (req, res, next) {
    ItemSchema.find({}, function (err, items) {
        var itemMap = [];
        var i = 0;
        items.forEach(function (item) {
            if (item.itemSellStatus === "false") {

                itemMap[parseInt(i)] = item;
                i++;
            }
        })
        res.send({response: itemMap, success: true});
    });
});

/* --deprecated :)
 router.post('/upload', function (req, res, next) {
 var path = '';
 upload(req, res, function (err) {
 if (err) {
 // An error occurred when uploading
 console.log(err);
 return res.status(422).send("an Error occured")
 }
 // No error occured.
 console.log(req.file);
 path = req.file.path;
 var itemImageUrl = req.file.path;
 return res.send(path);
 });
 })
 */


module.exports = router;
