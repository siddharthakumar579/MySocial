require("dotenv").config();

const PORT = process.env.PORT || 3000;
const cookieParser = require('cookie-parser');
const express = require('express')
const app = express();
const path = require('path');
const userModel = require('./models/user');
const postModel = require('./models/post');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const post = require('./models/post');
const user = require('./models/user');


app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.use(cookieParser())

app.get('/', (req, res) =>{

    res.cookie('token', '')
    res.render('index')
});

app.get('/login', (req, res) =>{
    res.cookie('token', '')
    res.render('login')
});

app.get('/logout', (req, res) =>{
    res.cookie('token', '')
    res.redirect('/')
});

app.post('/login', async (req, res) =>{

    let {email, password} = req.body
    let user = await userModel.findOne({email});

    if(!user) return res.status(500).send('Oops semething went wrong');

    bcrypt.compare(password, user.password, (err, result)=>{

        if(result) {

            let token = jwt.sign({email, userid: user._id}, process.env.JWT_SECRET);
            console.log(process.env.JWT_SECRET);
            res.cookie('token', token);

            return res.status(200).redirect('/profile');
        }
        res.redirect('/login')
    })
})

function isLoggedIn(req, res, next) {
    if(req.cookies.token === ""){
        res.status(500).send('You need to Login/Signup first');
    }
    else{
        // console.log(req.cookies.token);
        let data = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
        // console.log(data);
        req.user = data
        next();
    } 
}

app.get('/profile', isLoggedIn, async (req, res) =>{
    
    let user = await userModel.findOne({email:req.user.email}).populate('posts');
    // await user.populate("posts");
    res.render('profile', {user});
    // console.log(user);
    
})

app.get('/like/:id', isLoggedIn, async (req, res) =>{
    
    let post = await postModel.findOne({_id:req.params.id}).populate('user');
    if (post.likes.indexOf(req.user.userid)===-1) {
        post.likes.push(req.user.userid);
    }
    else{
        post.likes.splice(post.likes.indexOf(req.user.userid), 1)
    }
    await post.save();
    res.redirect('/profile')
    
})

app.get('/edit/:id', isLoggedIn, async (req, res) =>{
    
    let post = await postModel.findOne({_id:req.params.id}).populate('user');
    res.render('edit', {post})
    
})

app.post('/update/:id', isLoggedIn, async (req,res) =>{
    let post = await postModel.findOneAndUpdate({_id:req.params.id},{content: req.body.content});
    res.redirect('/profile')
})
app.get('/delete/:id', isLoggedIn, async (req,res) =>{
    let post = await postModel.findOneAndDelete({_id:req.params.id});
    res.redirect('/profile')
})

app.post('/post', isLoggedIn, async (req, res) =>{

    let user = await userModel.findOne({email:req.user.email})
    let {content} = req.body
    

    let createdPost = await postModel.create({
        user: user._id,
        content
    })
    user.posts.push(createdPost._id);
    await user.save();
    res.redirect('/profile');
})

app.post('/create', async (req, res) =>{
    let{username, password, age, name, email} = req.body;
    let user = await userModel.findOne({email});
    if(user) return res.status(500).send('user already exists');

    bcrypt.genSalt(10, (err, salt) =>{
        bcrypt.hash(password, salt, async (err, hash)=>{
            const createdUser = await userModel.create({
                username,
                email,
                name,
                age,
                password:hash,
            })
            let token = jwt.sign({email, userid: createdUser._id}, process.env.JWT_SECRET)
            res.cookie('token', token);
            res.redirect('/profile')
        })
    })

    // res.redirect('/profile')
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});