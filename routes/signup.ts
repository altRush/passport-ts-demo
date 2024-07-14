import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import db from '../db';

export const signupGet = (_req: Request, res: Response) => {
	res.render('signup');
};

export const signupPost = (req: Request, res: Response, next: NextFunction) => {
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
};
