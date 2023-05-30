
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose =require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportaLocalMongoose = require("passport-local-mongoose");

//const homeStartingContent = "A hub of inspiration, knowledge, and thought-provoking content! Here, we strive to create a platform where ideas flourish and conversations spark. Whether you're a passionate reader, a curious explorer, or a seeker of meaningful insights, you've come to the right place. Our blog is a melting pot of diverse topics, ranging from technology to lifestyle, science to art, and everything in between. Join us on this journey of discovery as we delve into the depths of intriguing subjects, share captivating stories, and provide valuable perspectives. Together, let's embark on a quest to expand our horizons and engage in a world of intellectual stimulation. Get ready to ignite your imagination and join the community of avid learners and avid sharers at Yash's Blog!";
const aboutContent = "I'm delighted to have you here and share a bit about myself. I'm currently a final-year B.Tech student pursuing a degree in Electronics and Communication Engineering.The world of technology has always fascinated me, and I've dedicated my time and efforts to becoming a skilled developer and coder. My journey in the field of programming has been filled with excitement and endless learning opportunities." ;
const aboutContent2= "I'm well-versed in various technologies that have become my toolkit for creating innovative solutions. JavaScript and its frameworks have allowed me to craft dynamic and interactive user experiences, while Node.js has empowered me to build robust back-end systems. Working with databases, particularly MongoDB, has further strengthened my skills in managing and manipulating data effectively. But my expertise doesn't stop there. I'm also proficient in languages like C++ and Python, which have opened doors to developing efficient algorithms and data structures. Exploring the vast possibilities of hardware programming, I've ventured into the fascinating world of Arduino and IoT. This combination of software and hardware has allowed me to create projects that bridge the digital and physical realms. As a passionate developer, I thrive on challenges and constantly seek opportunities to expand my knowledge. The joy of coding lies in the ability to bring ideas to life and create solutions that make a difference. I'm dedicated to staying up-to-date with the latest advancements and continuously refining my skills to deliver exceptional results. Through this blog, I aim to share my insights, experiences, and discoveries with you. I invite you to join me on this exciting journey as we explore the ever-evolving landscape of technology and its impact on our lives. Let's embark on this adventure together and engage in meaningful conversations that inspire and empower us to push the boundaries of what's possible.";
const aboutContent3="Thank you for visiting, and I look forward to connecting with you on My Travel BlogSite!";
const contactContent = "To contact developer Mail at: ";

const app = express();

app.set('view engine', 'ejs');

// For todays date;
Date.prototype.today = function () { 
  return ((this.getDate() < 10)?"0":"") + this.getDate() +"/"+(((this.getMonth()+1) < 10)?"0":"") + (this.getMonth()+1) +"/"+ this.getFullYear();
}

// For the time now
Date.prototype.timeNow = function () {
   return ((this.getHours() < 10)?"0":"") + this.getHours() +":"+ ((this.getMinutes() < 10)?"0":"") + this.getMinutes() +":"+ ((this.getSeconds() < 10)?"0":"") + this.getSeconds();
}


app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
//doing it for passport authorization
app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
//databse setup
mongoose.set('strictQuery', true);
const url =process.env.STRING_URL;
mongoose.connect(url,{useNewUrlParser:true});
const postSchema ={
    title: String,
    content: String,
    author: String,
    createdate: String,
    updatedby: String,
    updatedon: String
  };



//doing it to install plugin for this scehma that is why it is a mongoose schema and not a standard schema
const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String
});
userSchema.plugin(passportaLocalMongoose);
//creating models for mongodb or say collections
const Post = mongoose.model("Post",postSchema);
const User = mongoose.model("User",userSchema);
//passport setting up
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get("/", function(req, res){
  let loggedin=false;
  if(req.isAuthenticated()){
    loggedin=true;
  }
  else{
    loggedin=false;
  }
  Post.find({},function(err,posts){
    res.render("home", {
        posts: posts,
        loggedin,
        });
  });
  
});

app.get("/about", function(req, res){
  res.render("about", {aboutContent: aboutContent, aboutContent2: aboutContent2,aboutContent3:aboutContent3});
});

app.get("/contact", function(req, res){
  res.render("contact", {contactContent: contactContent});
});
app.get("/adminlogin",function(req,res){
  if(req.isAuthenticated()){
    res.redirect("/dashboard");
  }else{
    res.render("adminlogin");
  }
});
app.get("/dashboard", function(req, res){
  if(req.isAuthenticated()){
    res.render("dashboard",{user: req.user})
  }
  else{
    res.redirect("/adminlogin");
  }
});

app.get("/dashboard/compose", function(req, res){
  if(req.isAuthenticated()){
    res.render("compose",{name:req.user.name});
  }else{
    res.redirect("/adminlogin");
  }
});
app.get("/dashboard/changepassword",function(req,res){
  if(req.isAuthenticated()){
    res.render("changepassword",{name:req.user.name});
  }else{
    res.redirect("/adminlogin");
  }
});
app.get("/dashboard/update",function(req,res){
  if(req.isAuthenticated()){
    Post.find({},function(err,posts){
      res.render("update", {
          posts: posts,
          name:req.user.name
          });
    });
  }else{
    res.redirect("/adminlogin");
  }
});
app.get("/register",function(req,res){
  res.redirect("/adminlogin");
  //res.render("register");
});

app.get("/logout",function(req,res){
  req.logout(function(err) {
    if (err) { console.log(err); }
    res.redirect('/');
  });
});

app.post("/adminlogin", function(req, res, next) {
  passport.authenticate("local", function(err, user, info) {
    if (err) {
      console.log(err);
      return res.redirect("/adminlogin");
    }

    if (!user) {
      // Authentication failed
      return res.render("adminlogin", { failureMessage: true });
    }

    req.login(user, function(err) {
      if (err) {
        console.log(err);
        return res.redirect("/adminlogin");
      }

      return res.redirect("/dashboard");
    });
  })(req, res, next);
});

app.post("/dashboard/compose", function(req, res){
  var datetime = new Date().today() + " @ " + new Date().timeNow();
  const post = new Post({
    title: req.body.postTitle,
    content: req.body.postBody.replace(/\n/g,'<br>'),
    author: req.user.name,
    createdate: datetime
  });
  post.save(function(err){

    if (!err){
    
    res.redirect("/");
    
    }
});
});
app.post('/changepassword', function (req, res) {
  User.findByUsername(req.user.username, (err, user) => {
      if (err) {
          console.log(err);
      } else {
          user.changePassword(req.body.oldpassword, 
          req.body.newpassword, function (err) {
              if (err) {
                  console.log(err);
              } else {
                  res.redirect("/logout");
              }
          });
      }
  });
});

app.get("/posts/:postID", function(req, res){
//   const requestedTitle = _.lowerCase(req.params.postName);
  const requestedPostId = req.params.postID;
  Post.findOne({_id: requestedPostId}, function(err, post){

    res.render("post", {post});
    
    });
});
app.get("/update/:postID", function(req, res){
  //   const requestedTitle = _.lowerCase(req.params.postName);
    const requestedPostId = req.params.postID;
    Post.findOne({_id: requestedPostId}, function(err, post){
  
      res.render("updatepost", {
        post,
        name:req.user.name
      }
      );
      
      });
  });
  app.post("/update/:postID", function(req, res){
    //   const requestedTitle = _.lowerCase(req.params.postName);
      const requestedPostId = req.params.postID;
      var datetime = "LastSync: " + new Date().today() + " @ " + new Date().timeNow();
      Post.findByIdAndUpdate(requestedPostId, { title: req.body.postTitle, content: req.body.postBody.replace(/\n/g,'<br>'),updatedby: req.user.name, updatedon: datetime},function (err, docs) {
          if (err){
              console.log(err)
           }
          else{
            res.redirect("/posts/"+requestedPostId);
            console.log("Updated User : ", docs);
          }
});

    });

app.post("/delete/:postID", function(req, res){
  //   const requestedTitle = _.lowerCase(req.params.postName);
    const requestedPostId = req.params.postID;
    Post.findByIdAndRemove(requestedPostId,function(err){
      if(!err){
        console.log("successfully deleted checked item")
        res.redirect("/dashboard/update");
      }
    });
  });




//This is register route for post which currently has been disabled
app.post("/register",function(req,res){
  
  User.register({name:req.body.name,username: req.body.username},req.body.password,function(err,user){
    if(err){console.log(err);res.redirect("/register");}
    else{
      passport.authenticate("local")(req,res,function(){
        res.redirect("/dashboard");
      });
    }
  });
});

// this was using bcrypt 
// app.post("/adminlogin",function(req,res){
//   const username = req.body.username;
//   const password = req.body.password;
//   User.findOne({email: username},function(err,founduser){
//       if(err){console.log(err);}
//       else{
//           if(founduser){
//               bcrypt.compare(password,founduser.password,function(err,result){
//                   res.render("compose");
//               });
//           }
//           else{
//             res.redirect("adminlogin");
//           }
//       }
//   })
// });
// app.post("/register",function(req,res){
//   bcrypt.hash(req.body.password,saltRounds,function(err,hash){
//     const newuser =new User({
//       email: req.body.username,
//       password: hash
//   });
//   newuser.save(function(err){
//       if(err){console.log(err);}
//       else{res.redirect("/");}
//   });
//   });
// });

app.listen(3000, function() {
  console.log("Server started on port 3000");
});