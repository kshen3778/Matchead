var express = require('express');
var router = express.Router();
var indico = require('indico.io');
indico.apiKey = 'c2b3cb60914177594fd37d21b66a9e21';

var Twitter = require('twitter');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

var jwt = require('express-jwt');
var passport = require('passport');
var mongoose = require('mongoose');
var multer = require('multer');
var User = mongoose.model('User');
var Company = mongoose.model('Company');

var nodeUtil = require("util"),
            fs = require('fs'),
            PDFParser = require("pdf2json");

//middleware for authenticating jwt tokens
var auth = jwt({secret: 'SECRET', userProperty: 'payload'});

var client = new Twitter({
  consumer_key: "Ls5fYK70s4zpKrJyg98S19VVZ",
  consumer_secret: "FdGhltob4nsEdh1EyWogvcCz12LitAO19CFq8Rjppbx06uDbd2",
  access_token_key: "3893270962-NjaMgT5wsR7IOz9q8cfv5aUt0yezvNd1caBP9GP",
  access_token_secret: "LmtlQuOZi3ONZlJ3aHd9k8lIg1wnwweQWjzTro4CIsTyZ",
});



router.post('/analyze', auth, function(req,res,next){
      
  fs.readFile('KevinShenRESUME.txt', 'utf8', function (err,data) {
  if (err) {
    return console.log(err);
  }
  indico.namedEntities(data)
  .then(function(res) {
    console.log(res);
  }).catch(function(err) {
    console.warn(err);
  });
 });
   
      
    
 //get company tweets
 var params = {screen_name: req.body.company, trim_user: 0, exclude_replies: 1};
 client.get('statuses/user_timeline', params, function(error, tweets, response){
   if (!error) {
      // Parse company tweets
      var companyPosts = [];
      for(var i = 0; i < tweets.length; i++){
         companyPosts.push(tweets[i].text);
      }
       
      indico.analyzeText(companyPosts,{apis: ['sentiment_hq','political','personality']}).then(function(result) {
         // Company Tweet Analysis
         console.log("\n\nCompany Tweet Analysis\n");
         
         //
         // Averaging Company Sentiment
         //
         var averageCompanySentiment = 0;
         for(var i = 0; i < result.sentiment_hq.length; i++){
            averageCompanySentiment += result.sentiment_hq[i];
         }
         averageCompanySentiment /= result.sentiment_hq.length;
         
         console.log("Average Comapny Sentiment: " + averageCompanySentiment);
         
         //
         // Averaging Company Political Views
         //
         var averageCompanyPolitical = [0,0,0,0];
         for(var i = 0; i < result.political.length; i++){
            averageCompanyPolitical[0] += result.political[i].Libertarian;
            averageCompanyPolitical[1] += result.political[i].Green;
            averageCompanyPolitical[2] += result.political[i].Liberal;
            averageCompanyPolitical[3] += result.political[i].Conservative;
          }
         for(var a = 0; a < 4; a++){
            averageCompanyPolitical[a] /= result.political.length;
         }
         
         console.log("Average Company Political Views: " + JSON.stringify(averageCompanyPolitical));
         
         //
         // Averaging Company Personality
         //
         var averageCompanyPersonality = [0,0,0,0];
         for(var i = 0; i < result.personality.length; i++){
            averageCompanyPersonality[0] += result.personality[i].openness;
            averageCompanyPersonality[1] += result.personality[i].extraversion;
            averageCompanyPersonality[2] += result.personality[i].agreeableness;
            averageCompanyPersonality[3] += result.personality[i].conscientiousness;
         }
         for(var a = 0; a < 4; a++){
            averageCompanyPersonality[a] /= result.personality.length;
         }
         
         console.log("Average Company Personality: " + JSON.stringify(averageCompanyPersonality));
         // 
         // Store parsed company tweets to database
         //
         var co = new Company();
         co.twittername = req.body.company;
         co.political = averageCompanyPolitical;
         co.sentiment = averageCompanySentiment;
         co.personality = averageCompanyPersonality;
          
         co.save(function(err, comp){
            //console.log(err);
            if(err){
               return next(err); 
            }
            
            console.log("asdsad");
            console.log(req.payload);
            var urldata = req.payload.twitter.split("/");
            var usertwitter = urldata[urldata.length-1];
            console.log(usertwitter);
            params = {screen_name: usertwitter, trim_user: 0, exclude_replies: 1};
            client.get('statuses/user_timeline', params, function(error, tweets, response){
               if(!error){
                  // Parse personal tweets
                  var personalPosts = [];
                   for(var i = 0; i < tweets.length; i++){
                      personalPosts.push(tweets[i].text);
                   }
                  indico.analyzeText(personalPosts,{apis: ['sentiment_hq','political','personality']}).then(function(result2) {
                     console.log("\n\nPersonal Tweet Analysis\n");
                     
                     //
                     // Averaging Personal Sentiment
                     //
                     var averagePersonalSentiment = 0;
                     for(var i = 0; i < result2.sentiment_hq.length; i++){
                        averagePersonalSentiment += result2.sentiment_hq[i];
                     }
                     averagePersonalSentiment /= result2.sentiment_hq.length;
                     
                     console.log("Average Personal Sentiment: " + averagePersonalSentiment);
                     
                     //
                     // Averaging Personal Political Views
                     //
                     var averagePersonalPolitical = [0,0,0,0];
                     for(var i = 0; i < result2.political.length; i++){
                        averagePersonalPolitical[0] += result2.political[i].Libertarian;
                        averagePersonalPolitical[1] += result2.political[i].Green;
                        averagePersonalPolitical[2] += result2.political[i].Liberal;
                        averagePersonalPolitical[3] += result2.political[i].Conservative;
                     }
                     for(var a = 0; a < 4; a++){
                        averagePersonalPolitical[a] /= result2.political.length;
                     }
                     
                     console.log("Average Personal Political Views: " + JSON.stringify(averagePersonalPolitical));
                     
                     //
                     // Averaging Personal Personality
                     //
                     var averagePersonalPersonality = [0,0,0,0];
                     for(var i = 0; i < result2.personality.length; i++){
                        averagePersonalPersonality[0] += result2.personality[i].openness;
                        averagePersonalPersonality[2] += result2.personality[i].agreeableness;
                        averagePersonalPersonality[1] += result2.personality[i].extraversion;
                        averagePersonalPersonality[3] += result2.personality[i].conscientiousness;
                     }
                     for(var a = 0; a < 4; a++){
                        averagePersonalPersonality[a] /= result2.personality.length;
                     }
                     
                     console.log("Average Personal Personality: " + JSON.stringify(averagePersonalPersonality));
                     
                     //console.log("Sentiment Difference: " + Math.abs(averageCompanySentiment-averagePersonalSentiment));
                     
                     res.json({ csent: averageCompanySentiment, cpolitical: averageCompanyPolitical, cpersonality: averageCompanyPersonality, psent: averagePersonalSentiment, ppolitical: averagePersonalPolitical, ppersonality: averagePersonalPersonality });
                     
                  });
               }
            });
         });
          
       }).catch(function(err) {
         console.warn(err);
       });
     }
 });
});


var uploading = multer({
  dest: 'uploads/',
  limits: {fileSize: 1000000, files:1},
});

var storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, 'uploads/');
        },
        filename: function (req, file, cb) {

            var getFileExt = function(fileName){
                var fileExt = fileName.split(".");
                if( fileExt.length === 1 || ( fileExt[0] === "" && fileExt.length === 2 ) ) {
                    return "";
                }
                return fileExt.pop();
            };
            
            cb(null, Date.now() + '.' + getFileExt(file.originalname));
        }
});

var multerUpload = multer({ storage: storage,
   
   fileFilter: function(req,file,cb){
        var type = file.mimetype;
        console.log(type);
        if (type == "text/plain") {
          cb(null, true);
        }else {
          cb(null, false);
        }
   },
   limits: {fileSize: 1000000, files:1}
   
   }
);

router.post('/upload', multerUpload.single('file'), auth, function(req, res, next) {

    console.log("file upload");
    console.log(req.file);
    console.log(req.payload.username);
    
    var source = fs.createReadStream('uploads/' + req.file.filename);
    
    var dir = 'uploads/' + req.payload.username;
    //create directory if it doesn't exist
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }
    
   // console.log(JSON.stringify(req.payload));
    //delete the old resume
    if(req.payload.resume != ""){
        var filePath; 
        User.findOne({username: req.payload.username}, function(err, user){
        
            if(err){return err;}
            filePath = user.resume;
            console.log("File path: " + filePath);
            fs.unlinkSync(filePath);
            
            var dest = fs.createWriteStream(dir + '/' + req.file.filename);
            var resumepath = "uploads/" + req.payload.username + "/" + req.file.filename;
            console.log(resumepath);
            
            source.pipe(dest);
            source.on('end', function() {
                /* copied */ 
                fs.unlinkSync('uploads/' + req.file.filename); //remove original uploaded file
                console.log("copied");
                User.update({username: req.payload.username},{$set: {resume: resumepath}}, function(err, result){
                  
                  if(err){
                      return err;
                  }
                  res.json(result);
                  
               });
                //res.redirect("https://matchead-kshen3778.c9users.io/#/profile");
            });
            source.on('error', function(err) {
                /* error */ 
                if(err){
                    console.log("error copying");
                }
            });
        });
        
        
    }


   
   
});

//preload user profile
router.param('user', function(req,res,next,id){
    var query = User.findById(id); //find the task
   
   query.exec(function(err, user){
      if(err){
          return next(err);
      }
      if(!user){
          return next(new Error('Can\'t find user.'));
      }
      
      req.user = user;
      return next();
   });
    
});

//retrieve a specific user's profile
router.get('/profile', function(req, res, next){
    //TODO: create a special folder for user for their uploads
});

//passport register route
router.post('/register', function(req, res, next){
   if(!req.body.username || !req.body.password){
      return res.status(400).json({message: 'Please fill out all fields'});
   }
   
   var user = new User();
   
   user.username = req.body.username;
   user.resume = "";
   user.setPassword(req.body.password);
   
   user.save(function(err){
      if(err){
         return next(err);
      }
      //if registration is successful then return a JWT token to client
      return res.json({token: user.generateJWT()});
   });
   
});

//passport login route
router.post('/login', function(req,res,next){
   if(!req.body.username || !req.body.password){
      return res.status(400).json({message: 'please fill out all fields'});
   }
   
   passport.authenticate('local', function(err, user, info){
      if(err){
         return next(err);
      }
      if(user){
         //if authentication is successful return a JWT token to client
         return res.json({token: user.generateJWT()});
      } else{
         return res.status(401).json(info);
      }
   })(req,res,next);
});

module.exports = router;

