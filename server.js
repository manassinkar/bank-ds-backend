let express = require("express");
let app = express();
let cors = require('cors');
let bodyParser = require("body-parser");
let mongoose = require("mongoose");
let bcrypt = require("bcryptjs")

const http = require('http').Server(app);
const io = require('socket.io')(http);

const server = http.listen(3000, function() {
    console.log("Server Started on port 3000");
    mongoose.connect("mongodb+srv://admin:admin@bank-mafeq.mongodb.net/test?retryWrites=true&w=majority",{ useUnifiedTopology: true,useNewUrlParser: true, useCreateIndex: true },(err) =>
    {
        if(err)
        {
            console.log("Failed to Connect to Database");
        }
        else
        {
            console.log("Successfully Connected to Database");
        }
    });
});

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

let User = require('./user.model');

app.post('/register', (req,res) =>
{
    let db = mongoose.connection.db;
    var acc = Math.random()*100000000;
    var user = new User({
        name: req.body.name,
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password,10),
        contact: req.body.contact,
        accountNo: Math.round(acc),
        balance: 0,
    });
    user.save((err) =>
    {
        if(err)
        {
            res.status(500).send({ message:"Registeration Failed", error: err });
        }
        else
        {
            res.status(200).send({ message:"Registered Successfully" });
        }
    });
});

app.post('/login', (req,res) =>
{
    User.findOne({ email: req.body.email },(err,result) =>
    {
        if(err)
        {
            res.status(500).send({ message:"Login Failed", error: err });
        }
        else
        {
            if(result)
            {
                bcrypt.compare(req.body.password,result.password,(er,success) =>
                {
                    if(success)
                    {
                        res.status(200).send({ name: result.name,email: result.email,contact: result.contact,accountNo: result.accountNo,balance: result.balance });
                    }
                    else
                    {
                        res.status(500).send({ message:"Wrong Password" });
                    }
                });
            }
            else
            {
                res.status(404).send({ message:"User Not Found" });
            }
        }
    });
});

app.get('/getUser',(req,res) =>
{
    User.findOne({ email: req.query.email },(err,result) =>
    {
        if(err)
        {
            res.status(500).send({ message:"Couldn't fetch User Data", error: err });
        }
        else
        {
            if(result)
            {
                res.status(200).send(result);
            }
            else
            {
                res.status(404).send({ message:"User Not Found" });
            }
        }
    });
});

app.post('/deposit',(req,res) =>
{
    User.updateOne({ email: req.body.email },{ $inc: { balance: req.body.amount } },(err,result) =>
    {
        if(err)
        {
            res.status(500).send({ message:"Couldn't fetch User Data", error: err });
        }
        else
        {
            if(result)
            {
                res.status(200).send({ message: "Balance Updated Successfully" });
            }
            else
            {
                res.status(404).send({ message:"User Not Found" });
            }
        }
    });
});

app.post('/withdraw',(req,res) =>
{
    User.findOne({ email: req.body.email },(err,result) =>
    {
        if(err)
        {
            res.status(500).send({ message:"Couldn't fetch User Data", error: err });
        }
        else
        {
            if(result)
            {
                if(result.balance>=req.body.amount)
                {
                    User.updateOne({ email: req.body.email },{ $inc: { balance: -req.body.amount } },(er,re) =>
                    {
                        if(er)
                        {
                            res.status(500).send({ message: "Balance Updation Failed", error: er })
                        }
                        else
                        {
                            res.status(200).send({ message: "Balance Updated Successfully" });
                        }
                    });
                }
                else
                {
                    res.status(401).send({ message: "Insufficient Balance" });
                }
            }
            else
            {
                res.status(404).send({ message:"User Not Found" });
            }
        }
    });
});

io.sockets.on('connection', function(socket)
{
    socket.on('username', function(username)
    {
        socket.username = username
        io.emit('is_online',{ from: socket.username ,message:'joined the chat' });
    });

    socket.on('disconnect', function()
    {
        io.emit('is_online',{ from: socket.username ,message:'left the chat' });
    });

    socket.on('chat_message', function(mess)
    {
        io.emit('chat_message',{ from:mess.from, message:mess.message });
    });
});