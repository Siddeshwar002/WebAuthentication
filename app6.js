//jshint esversion:6


require("dotenv").config();
// should always be on the TOP
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption");
// const md5 = require("md5"); 
// const bcrypt = require("bcrypt");
// const saltRounds = 10;
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


// USE session
app.use(session({
    secret : "Sherlock's SECRET",
    resave : false,
    saveUninitialized: false,
  cookie: { secure: false }
}));

// These 2 USE 
app.use(passport.initialize());
app.use(passport.session());


mongoose.connect("mongodb://localhost:27017/userDB" , {useNewUrlParser : true});

// If ERROR occurs then, to resolve a error
// mongoose.set("useCreateIndex" , true);


// userSchema in a JSON Type

// const userSchema = {
//     email : String,
//     password : String
// };


// userSchema in a Object-mode created
const userSchema = new mongoose.Schema ({
    email : String,
    password : String
});


userSchema.plugin(passportLocalMongoose);
// To HASH and SALT the passwords
//and store them in our database
// does a lot of heavy lifting



// New Plugin
userSchema.plugin(findOrCreate);


// once the plugins are added only then the new model has to be created
const User = new mongoose.model("User" , userSchema);



passport.use(User.createStrategy());
// passport.serializeUser(User.serializeUser());
// creates the COOKIE and store all the data, identity and authentication
// passport.deserializeUser(User.deserializeUser());
// Breaksdown the COOKIE and takes out the information inside it



// Passport Documentation
// serializing and deserializing
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});



// Should be placed below the Sessions
passport.use(new GoogleStrategy({

    // Remember to change the clientID and clientSecret
    clientID: process.env.clientID,
    clientSecret: process.env.clientSECRET,

    // URL needs to be changed
    callbackURL: "http://localhost:3000/auth/google/secrets",

    // Add this extra line -->Google+ update
    userProfileURL : "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {

    console.log(profile);

    const user = new User({
        // id : profile.id
        username : profile.displayName,
        password : profile.id

    });


    // Saving User's data
    user.save(function(err){
        if(err){
            console.log(err);
        }
    });
    
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));



app.get("/" ,  function(req,res){
    res.render("home");
});
app.get("/login" ,  function(req,res){
    res.render("login");
});
app.get("/register" ,  function(req,res){
    res.render("register");
});

 

// This time we have a  GET REQUEST <==> SECRETS 
// this will check the Authentication
// if the USER is still LOGGED-IN
// only then the SECRETS are rendered

app.get("/secrets" , function(req,res){

    // isAutheniticated() is a function
    if(req.isAuthenticated()){
        res.render("secrets");
    }
    else if(req.isUnauthenticated()){
        res.redirect("/login");
    }
});


app.get("/auth/google" ,
        passport.authenticate("google" , {scope : ["profile"]})
);


app.get("/auth/google/secrets" , 
       passport.authenticate("google" , {failureRedirect : "/login"}), 
            function(req,res){
              res.redirect("/secrets");
});


app.post("/register" , function(req,res){

    // No need to create USER data
    // No need to STORE the values

    // passport-local-mongoose  ---> will takecare of the DATA CREATION and DATA SAVING in DATABASE

    User.register({username:req.body.username} , req.body.password , function(err,user){

        if(err){
        console.log(err);
// [UserExistsError]: A user with the given username is already registered
        res.redirect("/register");
    }else{

        passport.authenticate("local")(req,res,function(){
            // render or redirect ? ? ?
            res.render("secrets");
        });
    }

    });
}); 


app.post("/login" , function(req,res){

    // create USER --> used for COMPARISION
    const user = new User({
        username : req.body.username,
        password : req.body.password
        });


    // user --> created is passed onto this login function
    req.login(user , function(err){
        if(err){
            console.log(err);
        }else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            });
        }
    });
});


app.get("/logout" , function(req,res){
    req.logout();
    res.redirect("/");
});


app.listen(3000,function(req,res){
    console.log("Sucessfully STARTED");
}); 