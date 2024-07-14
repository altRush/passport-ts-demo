import { NextFunction, Request, Response } from 'express';
import { Todo } from '../types';
import { VerifyFunction } from 'passport-local';
import crypto from 'crypto';
import db from '../db';

export const fetchTodos = (req: Request, res: Response, next: NextFunction) => {
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
};

export const verify: VerifyFunction = (username, password, cb) => {
	db.get(
		'SELECT * FROM users WHERE username = ?',
		[username],
		(err, row: Express.User) => {
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
};
