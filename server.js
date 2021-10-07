const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser');
var mongoose = require('mongoose');

app.use(bodyParser.urlencoded({extended: false}));

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

mongoose.connect(process.env.MONGO_URI);

let User;

const logSchema = new mongoose.Schema({
  description: String,
  duration: Number,
  date: {type: Date, default: Date.now()}
});
const userSchema = new mongoose.Schema({
  username: String,
  log: [logSchema]
});

User = mongoose.model('User', userSchema);

app.route('/api/users')
.post((req,res) => {
  var username = req.body.username;
  
  var newUser = new User({
    username: username
  });
  newUser.save((err, newUserData) => (err ? res.send(err) : res.json(newUserData)));
})
.get((req, res) => {
  User.find({}).select('-log -exercises').exec((err, results) => (err ? res.send(err) : res.json(results)));
    
});

app.route('/api/users/:_id/exercises')
.post((req,res) => {
  
  const newLog = {
    description: req.body.description,
    duration: req.body.duration ,
    date: req.body.date ? req.body.date : Date.now()
  };
  
  User.findById(req.params._id).exec((err, userLogs) => {
    if(err) res.send(err);
    
    userLogs.log.push(newLog);
      
      userLogs.save((err, updatedLog) => {
      if (err) res.send(err);
      
      var length = updatedLog.log.length - 1;  
        
      res.json({
        username: updatedLog.username,
        description: updatedLog.log[length].description,
        duration: updatedLog.log[length].duration,
        date: updatedLog.log[length].date.toDateString(),
        _id: updatedLog._id,
      });   
    });
  }); 
});


app.route('/api/users/:_id/logs')
.get((req,res) => {
  
  const {from, to, limit} = req.query;
  
  limit ? console.log("limit: "+limit) : console.log("no limit found");
  
  
    
  User.findById(req.params._id).sort({date: 'desc'}).exec((err, userLogs) => {
    if(err) res.send(err);
      
   const { _id, username, log } = userLogs;
    console.log("id: "+_id);
    console.log("username: "+username);
    console.log(log);
    
    let resultLog = [...log];
    
    if (from) {
      const dateFrom = new Date(from);
      resultLog = resultLog.filter(exercise => exercise.date >= dateFrom);
    }
    
    if (to) {
      const dateTo = new Date(to);
      resultLog = resultLog.filter(exercise => exercise.date <= dateTo);
    }
    
    if (limit) {
      resultLog = resultLog.slice(0, limit);
    }
    
    // map log results
    resultLog = resultLog.map(exercise => ({description: exercise.description, duration: exercise.duration, date: exercise.date.toDateString()}));
    
    res.json({
      username,
      count: resultLog.length,
      _id,
      log: resultLog
    });
   
});
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
