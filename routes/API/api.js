/**
 * Created by Pratik on 8/30/2017.
 */
// NPM modules
var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var ObjectId = require('mongodb').ObjectID;
var moment = require('moment-timezone');
var jwt = require("jsonwebtoken");
var request = require('request');
var async = require('async');
var crypto = require('crypto');
var nodemailer = require('nodemailer');
var cnf = require('../../config').env;
var cnf = require('../../config').env;
var cfg = require("../../config");
var URL = cfg.db.URL;
//Create All the Schemas Here...
var UserSchema = require("../models/UserSchema").User;
var ItemSchema = require("../models/ItemSchema").Item;


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
            var token = jwt.sign(payload, cfg.authJWT.jwtSecret);
            res.json({response: user, success: "true", token: token});
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

    console.log(userName);
    console.log(password);
    console.log(gender);
    console.log(mobileNumber);
    console.log(emailAddress);
    console.log(profileImageUrl);
    console.log(semester);

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

module.exports = router;