const express = require('express');
require('dotenv').config();
const session = require('express-session');
const bodyParser = require('body-parser');
const fileupload = require('express-fileupload');

// create new express app and save it as "app"
const app = express();

app.use(session({secret: 'mySecret', resave: false, saveUninitialized: false}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(fileupload());

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

const PORT = 3000;

app.use(express.static(__dirname + '/public'));
app.use('/', require('./route/home.route'));
app.use('/display', require('./route/display.route'));
app.use('/paypal', require('./route/paypal.route'));



app.listen(PORT, () => {
    console.log(`Server running at: http://localhost:${PORT}/`);
});