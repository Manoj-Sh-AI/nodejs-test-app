import express from "express";
import path from "path"
import mongoose from "mongoose";  // Important for Mongodb operations
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

//CONNECTING TO DATABASE IN MONGODB
mongoose.connect("mongodb://127.0.0.1:27017", {
    dbName:"backend"
})
.then(()=>console.log("Database Connected"))
.catch((e) => console.log(e));  // error will be caught here

//Creating Schema
const user_schema = new mongoose.Schema({
    name: String,
    email: String,
    password: String
});

//Creating Model or Collection
const User = mongoose.model("User", user_schema);

const server = express();  // Server is created

// Setting up view engine
server.set("view engine", "ejs");  // also prevents from writing extinctions

// USING MIDDLEWERES
server.use(express.static(path.join(path.resolve(), "public")));  // server is using thee filepath of public folder which can be used to send Frontend/static files
server.use(express.urlencoded({extended: true}));
server.use(cookieParser())

// public dir serves frontend files to this file
//  Authentication
const isAuthenticated = async (req, res, next) => {
    const token = req.cookies.token;

    if(token)
    {   
        const decoded = jwt.verify(token, "drtthtghrergvretg");

        req.user = await User.findById(decoded._id);

        next();
    }
    else{
        res.redirect("/login");
    }
}
server.get("/",isAuthenticated, (req, res)=>{

    res.render("logout", {name: req.user.name});
});

server.get("/login", (req, res)=>{
    res.render("login");
})

server.get("/register", (req, res)=>{

    res.render("register");
});

server.post("/login", async (req, res)=>{
    const {email, password} = req.body;

    let user = await User.findOne({email});

    if(!user){
        return res.redirect("/register");
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if(!isMatch){
        return res.render("login", {email, message: "Incorrect Password"});
    }

    const token = jwt.sign({_id: user._id}, "drtthtghrergvretg");

    res.cookie("token", token, { 
        httpOnly: true,
        expires: new Date(Date.now() + 60 * 1000),
    });
    res.redirect("/")

})
server.post("/register", async (req, res) => {
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;

    let user = await User.findOne({email});
    if(user) {
        return res.redirect("/login");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user = await User.create({
        name,
        email,
        password: hashedPassword
    }) // returns promis

    const token = jwt.sign({_id: user._id}, "drtthtghrergvretg");

    res.cookie("token", token, { 
        httpOnly: true,
        expires: new Date(Date.now() + 60 * 1000),
    });
    res.redirect("/")
});

server.get("/logout", (req, res) => {
    res.cookie("token", null, {
        httpOnly: true,
        expires: new Date(Date.now()),
    });
    res.redirect("/")
});

server.listen(5000, () => {
    console.log("Server is listening...")
});