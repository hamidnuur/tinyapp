// dependencies
const express = require("express");
const cookieParser = require('cookie-parser')
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const app = express();
const PORT = 8080; // default port 8080
app.use(cookieParser())
const {
  getUserByEmail,
  getUserById,
  urlsForUser,
  generateRandomID,
  generateRandomString,
} = require("./helpers");

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({ 
name: 'session',
keys: ['key1', 'key2']
  
}));

app.set("view engine", "ejs")
app.use("/static", express.static("public"));

const urlDatabase = {
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

//handles user input form submission
app.post("/urls", (req, res) => {
  // validate if cookie exists
  const {user_id} = req.session;
  if (!user_id) {
    return res.status(400).send("You need to be logged in!");
  }
  
  // validate if the cookie is from an existing user
  const validUser = usersDb[user_id];
  if (!validUser) {
    return res.status(400).send("You are not a valid user!");
  }

  // validate if the user passed a longURL to create a shortURL
  const {longURL} = req.body;
  if (!longURL) {
    return res.status(400).send("You need to pass a longURL!");
  }

  // after validating, we create the shortURL and the url database object
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
      longURL: longURL,
      userID: user_id,
    };
  res.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:shortURL", (req, res) => {
  // validate if cookie exists
  const {user_id} = req.session;
  if (!user_id) {
    return res.status(400).send("You need to be logged in!");
  }
  
  // validate if the cookie is from an existing user
  const validUser = usersDb[user_id];
  if (!validUser) {
    return res.status(400).send("You are not a valid user!");
  }

  // validate url object exists
  const {shortURL} = req.params;
  const urlObject = urlDatabase[shortURL];
  if (!urlObject) {
    return res.status(400).send("This URL object does not exist!");
  }

  // validate if url object belongs to logged in user
  const urlBelongsToUser = urlObject.userID === validUser.id;
  if (!urlBelongsToUser) {
    return res.status(400).send("You are not the owner of this URL!")
  }

  // validate if the user passed a longURL to create a shortURL
  const {longURL} = req.body;
  if (!longURL) {
    return res.status(400).send("You need to pass a longURL!");
  }

  // after validating, we create the shortURL and the url database object
  urlDatabase[shortURL] = {
      longURL: longURL,
      userID: user_id,
    };
  res.redirect(`/urls/${shortURL}`);

});

// deletes a link off your url page
app.post("/urls/:shortURL/delete", (req, res) => {
  // validate if cookie exists
  const {user_id} = req.session;
  if (!user_id) {
    return res.status(400).send("You need to be logged in!");
  }
  
  // validate if the cookie is from an existing user
  const validUser = usersDb[user_id];
  if (!validUser) {
    return res.status(400).send("You are not a valid user!");
  }

  // validate url object exists
  const {shortURL} = req.params;
  const urlObject = urlDatabase[shortURL];
  if (!urlObject) {
    return res.status(400).send("This URL object does not exist!");
  }

  // validate if url object belongs to logged in user
  const urlBelongsToUser = urlObject.userID === validUser.id;
  if (!urlBelongsToUser) {
    return res.status(400).send("You are not the owner of this URL!")
  }

  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

//redirect to user's existing list of urls
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

//handles user logout
app.post('/logout', (req, res) => {
  req.session = null
  res.redirect('/urls');
});

// get home page
app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

// allows new user to register
app.get('/register', (req, res) => {
  const userId = req.session.user_id

  const user = usersDb[userId]
  const templateVars = {
    user: user
    
    // ... any other vars
  };
  res.render("register", templateVars);

})

//validates registration, sends user to list of urls
app.post('/register', (req, res) => {
  const {email, password, name} = req.body;
  const id = generateRandomID();
  const emailExist = getUserByEmail(email, usersDb);

  // check if all fields have been filled out
  if(!email || !password || emailExist) {
    return res.send(400, "your email or password is invalid!'")
  } else {
    req.session.user_id = id;
    const hashedPassword = bcrypt.hashSync(req.body.password, 10);
    usersDb[id] = {id: id, name: req.body.name, email: email, password: hashedPassword}
  }
  res.redirect('/urls');
});

//login page for registered user
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
 //list of logged in user's urls
 app.get("/urls", (req, res) => {
  const userID = req.session.user_id;
  const urlsForUserDB = urlsForUser(userID, urlDatabase);
  const user = getUserById(userID, usersDb); //return an object

  if (!user) {
    res.redirect("/login");
  } else {
    const templateVars = { urls: urlsForUserDB, user: user };
    res.render("urls_index", templateVars);
  }
});


app.get("/urls/new", (req, res) => {
  const userID = req.session.user_id;
  const user = getUserById(userID, usersDb);
  const urlsForUserDB = urlsForUser(userID, urlDatabase);

  if (user === null) {
    return res.redirect("/login");
  }
  const templateVars = {
    urls: urlsForUser,
    user: usersDb[userID],
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const userId = req.session.user_id
  // let templateVars = {}
  if (userId == null) {
    return res.send("You are not the owner of this url!")
  }
  const urlsForUserDB = urlsForUser(userId, urlDatabase);
  const shortURL = req.params.shortURL;
  for (let url in urlsForUserDB) {
    if (url == shortURL) {
      const user = usersDb[userId]
      const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: user };
      res.render("urls_show", templateVars);
    }
  }
  return res.send("You are not the owner of this url!")
});



// redirects to long url page
app.get("/u/:shortURL", (req, res) => {
  const userId = req.session.user_id

  if (userId == null) {
    return res.send("You are not the owner of this url!")
  }

  const shortURL = req.params.shortURL;
  const urlsForUserDB = urlsForUser(userId, urlDatabase);

  const longURL = urlsForUserDB[shortURL].longURL;
  // console.log(longURL);
  console.log(urlsForUserDB);
  res.redirect(longURL);
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});