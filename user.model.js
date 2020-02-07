let mongoose = require('mongoose');

var user = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    contact: { type: Number, required: true },
    accountNo: { type: Number, required: true },
    balance: { type: Number, required: true },
});

var User = mongoose.model('user',user);
module.exports = User;