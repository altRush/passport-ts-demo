import dotenv from 'dotenv';
dotenv.config();

import debugImport from 'debug';
const debug = debugImport('todos:server');

import http from 'http';

import createError, { HttpError } from 'http-errors';
import express, { Request, Response } from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import session, { Store } from 'express-session';
import SQLiteStoreImport from 'connect-sqlite3';

import router from './routes';

const app = express();
const SQLiteStore = SQLiteStoreImport(session);

import pluralize from 'pluralize';
import passport from 'passport';

app.locals.pluralize = pluralize;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(
	session({
		secret: 'keyboard cat',
		resave: false,
		saveUninitialized: false,
		store: new SQLiteStore({ db: 'sessions.db', dir: './var/db' }) as Store
	})
);
app.use(passport.authenticate('session'));

app.use('/', router);

// catch 404 and forward to error handler
app.use((req, res, next) => {
	next(createError(404));
});

// error handler
app.use((err: HttpError, req: Request, res: Response) => {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.render('error');
});

const port = process.env?.PORT || 3000;

app.set('port', port);

const server = http.createServer(app);

server.listen(port);
server.on('error', err => {
	console.log(err);
});
server.on('listening', () => {
	console.log(`Serving on port ${port}`);
});
