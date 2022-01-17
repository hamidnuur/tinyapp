const express = require("express");
const cookieParser = require('cookie-parser')
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const { getUserByEmail, generateRandomString, generateRandomID } = require('./helpers.js');
const bcrypt = require('bcryptjs');
const app = express();
const PORT = 8080; // default port 8080
app.use(cookieParser())

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({ 
name: 'session',
keys: ['key1', 'key2']
  
}));

app.set("view engine", "ejs")

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const usersDb = {
  '8fh38dhs': {
    id: '8fh38dhs',
    name: 'hamid',
    email: 'hamid@live.com',
    password: '1234',
  },
  '1dc937ec': {
    id: '1dc937ec',
    name: 'nur',
    email: 'nur@hotmail.ca',
    password: '1234',
  },
};

app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  let short = generateRandomString();
  urlDatabase[short] = req.body.longURL;
  console.log(urlDatabase);
  res.redirect(`/urls/${short}`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const {email, password} = req.body;
  if (!email || !password) {
    return res.send(400, "you need to pass an email and password!")
  }

  const user = getUserByEmail(email, usersDb);
  if(!user) {
    return res.send(400, "User does not exist")
  } 

  const passwordMatch = bcrypt.compareSync(password, user.password);
    if(!passwordMatch) {
      return res.send(400, "Password does not match.")
  }

  req.session.user_id = user.id;
  res.redirect('/urls');
});

app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const newLongURL = req.body.longURL;
  urlDatabase[shortURL] = newLongURL;
  res.redirect("/urls");
});

app.post('/logout', (req, res) => {
  req.session = null
  res.redirect('/urls');
});

app.post('/register', (req, res) => {
  res.redirect('/urls');
  const hashedPassword = bcrypt.hashSync(req.body.password, 10);
  const id = generateRandomID();
  usersDb[id] = {id: id, name: req.body.name, email: req.body.email, password: hashedPassword}
});

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get('/register', (req, res) => {
  const userId = req.session.user_id

  const user = usersDb[userId]
  const templateVars = {
    user: user
    
    // ... any other vars
  };
  res.render("register", templateVars);

})

app.get('/login', (req, res) => {
  const templateVars = {user: null};

  res.render('login', templateVars)
});


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/set", (req, res) => {
  const a = 1;
  res.send(`a = ${a}`);
 });
 
 app.get("/fetch", (req, res) => {
  res.send(`a = ${a}`);
 });

 app.get("/urls", (req, res) => {
  const userId = req.session.user_id

  const user = usersDb[userId]
  const templateVars = { urls: urlDatabase, user: user };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {user: req.session.user_id}
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const userId = req.session.user_id

  const user = usersDb[userId]
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: user };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});