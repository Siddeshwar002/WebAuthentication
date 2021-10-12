//jshint esversion:6


require("dotenv").config();
// should always be on the TOP
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption");
// const md5 = require("md5"); 
const bcrypt = require("bcrypt");
const saltRounds = 10;


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/userDB" , {useNewUrlParser : true});




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




// once the plugins are added only then the new model has to be created
const User = new mongoose.model("User" , userSchema);

app.get("/" ,  function(req,res){
    res.render("home");
});
app.get("/login" ,  function(req,res){
    res.render("login");
});
app.get("/register" ,  function(req,res){
    res.render("register");
});

// we dont have GET REQUEST FOR SECRETS 
// the page will only be renderd if the person if logged-in 

// app.get("/secrets" , function(req,res){
// });

app.post("/register" , function(req,res){

    // const password = req.body.password;
    bcrypt.hash( req.body.password , saltRounds , function(err,hashedPassword){

    const newUser = new User({
        email : req.body.username,
        password :hashedPassword
    });

    newUser.save(function(err){
        if(err){
            console.log(err);
        }else{
            res.render("secrets");
        }
    });

    });
    
}); 

app.post("/login" , function(req,res){
    const userName = req.body.username;
    const password = req.body.password;

    User.findOne({email : userName } , function(err, foundUser){

        if(err){
            console.log(err);
        }
        else{
            if(foundUser){
              bcrypt.compare(password , foundUser.password , function(err , result){
                  
                  console.log(password);
                  console.log(foundUser.password);

                if(password == foundUser.password){
                    res.render("secrets");
                }

              });

            }
        }
    });
});


app.listen(3000,function(req,res){
    console.log("Sucessfully STARTED");
})