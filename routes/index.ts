import express, { NextFunction, Request, Response } from 'express';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import crypto from 'crypto';
import db from '../db';

interface Todo {
	id: string;
	title: string;
	completed: number;
}

declare global {
	namespace Express {
		interface User {
			id: number;
			salt: string;
			hashed_password: NodeJS.ArrayBufferView;
			username: string;
		}
	}
}

function fetchTodos(req: Request, res: Response, next: NextFunction) {
	db.all(
		'SELECT * FROM todos WHERE owner_id = ?',
		[req.user?.id],
		(err, rows) => {
			if (err) {
				return next(err);
			}

			const todos = (rows as Todo[]).map(row => {
				return {
					id: row.id,
					title: row.title,
					completed: row.completed == 1 ? true : false,
					url: '/' + row.id
				};
			});
			res.locals.todos = todos;
			res.locals.activeCount = todos.filter(todo => {
				return !todo.completed;
			}).length;
			res.locals.completedCount = todos.length - res.locals.activeCount;
			next();
		}
	);
}

const router = express.Router();

passport.serializeUser(function (user: Express.User, cb) {
	process.nextTick(function () {
		cb(null, { id: user.id, username: user.username });
	});
});

passport.deserializeUser(function (user: Express.User, cb) {
	process.nextTick(function () {
		return cb(null, user);
	});
});

passport.use(
	new LocalStrategy(function verify(username, password, cb) {
		db.get(
			'SELECT * FROM users WHERE username = ?',
			[username],
			function (err, row: Express.User) {
				if (err) {
					return cb(err);
				}
				if (!row) {
					return cb(null, false, {
						message: 'Incorrect username or password.'
					});
				}

				crypto.pbkdf2(
					password,
					row.salt,
					310000,
					32,
					'sha256',
					function (err, hashedPassword) {
						if (err) {
							return cb(err);
						}
						if (!crypto.timingSafeEqual(row.hashed_password, hashedPassword)) {
							return cb(null, false, {
								message: 'Incorrect username or password.'
							});
						}
						return cb(null, row);
					}
				);
			}
		);
	})
);

/* GET home page. */
router.get(
	'/',
	(req: Request, res: Response, next) => {
		if (!req?.user) {
			return res.render('home');
		}
		next();
	},
	fetchTodos,
	(req, res) => {
		res.locals.filter = null;
		res.render('index', { user: req.user });
	}
);

router.get('/login', (req, res: Response, next) => {
	res.render('login');
});

router.get('/signup', function (req, res, next) {
	res.render('signup');
});

router.get('/active', fetchTodos, (req: Request, res: Response, next) => {
	res.locals.todos = (res.locals.todos as Todo[]).filter(todo => {
		return !todo.completed;
	});
	res.locals.filter = 'active';
	res.render('index', { user: req.user });
});

router.get('/completed', fetchTodos, (req: Request, res: Response, next) => {
	res.locals.todos = (res.locals.todos as Todo[]).filter(todo => {
		return todo.completed;
	});
	res.locals.filter = 'completed';
	res.render('index', { user: req.user });
});

router.post(
	'/',
	(req: Request, res: Response, next) => {
		req.body.title = req.body.title.trim();
		next();
	},
	(req, res, next) => {
		if (req.body.title !== '') {
			return next();
		}
		return res.redirect('/' + (req.body.filter || ''));
	},
	(req, res, next) => {
		db.run(
			'INSERT INTO todos (owner_id, title, completed) VALUES (?, ?, ?)',
			[req.user?.id, req.body.title, req.body.completed == true ? 1 : null],
			err => {
				if (err) {
					return next(err);
				}
				return res.redirect('/' + (req.body.filter || ''));
			}
		);
	}
);

router.post('/signup', function (req, res, next) {
	var salt = crypto.randomBytes(16);
	crypto.pbkdf2(
		req.body.password,
		salt,
		310000,
		32,
		'sha256',
		function (err, hashedPassword) {
			if (err) {
				return next(err);
			}
			db.run(
				'INSERT INTO users (username, hashed_password, salt) VALUES (?, ?, ?)',
				[req.body.username, hashedPassword, salt],
				function (err) {
					if (err) {
						return next(err);
					}
					var user = {
						id: this.lastID,
						username: req.body.username
					};
					req.login(user as Express.User, function (err) {
						if (err) {
							return next(err);
						}
						res.redirect('/');
					});
				}
			);
		}
	);
});

router.post(
	'/login/password',
	passport.authenticate('local', {
		successRedirect: '/',
		failureRedirect: '/login'
	})
);

router.post('/logout', function (req, res, next) {
	req.logout(function (err) {
		if (err) {
			return next(err);
		}
		res.redirect('/');
	});
});

router.post(
	'/:id(\\d+)',
	(req: Request, res: Response, next) => {
		req.body.title = req.body.title.trim();
		next();
	},
	(req, res, next) => {
		if (req.body.title !== '') {
			return next();
		}
		db.run(
			'DELETE FROM todos WHERE id = ? AND owner_id = ?',
			[req.params.id, req.user?.id],
			err => {
				if (err) {
					return next(err);
				}
				return res.redirect('/' + (req.body.filter || ''));
			}
		);
	},
	(req, res, next) => {
		db.run(
			'UPDATE todos SET title = ?, completed = ? WHERE id = ? AND owner_id = ?',
			[
				req.body.title,
				req.body.completed !== undefined ? 1 : null,
				req.params.id,
				req.user?.id
			],
			err => {
				if (err) {
					return next(err);
				}
				return res.redirect('/' + (req.body.filter || ''));
			}
		);
	}
);

router.post('/:id(\\d+)/delete', (req: Request, res: Response, next) => {
	db.run(
		'DELETE FROM todos WHERE id = ? AND owner_id = ?',
		[req.params.id, req.user?.id],
		err => {
			if (err) {
				return next(err);
			}
			return res.redirect('/' + (req.body.filter || ''));
		}
	);
});

router.post('/toggle-all', (req: Request, res: Response, next) => {
	db.run(
		'UPDATE todos SET completed = ? WHERE owner_id = ?',
		[req.body.completed !== undefined ? 1 : null, req.user?.id],
		err => {
			if (err) {
				return next(err);
			}
			return res.redirect('/' + (req.body.filter || ''));
		}
	);
});

router.post('/clear-completed', (req: Request, res: Response, next) => {
	db.run(
		'DELETE FROM todos WHERE owner_id = ? AND completed = ?',
		[req.user?.id, 1],
		err => {
			if (err) {
				return next(err);
			}
			return res.redirect('/' + (req.body.filter || ''));
		}
	);
});

export default router;
