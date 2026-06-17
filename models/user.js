const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI)

const userSchema = mongoose.Schema({
    username: String,
    email: String,
    name: String,
    age: Number,
    password: String,
    posts:[{
        type:mongoose.Schema.Types.ObjectId,
        ref: "post"
    }]
})

module.exports = mongoose.model('user', userSchema);