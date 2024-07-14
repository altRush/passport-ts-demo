import { NextFunction, Request, Response } from 'express';
import { fetchTodos } from '../middlewares';
import db from '../db';

export const homeGet = [
	(req: Request, res: Response, next: NextFunction) => {
		if (!req?.user) {
			return res.render('home');
		}
		next();
	},
	fetchTodos,
	(req: Request, res: Response) => {
		res.locals.filter = null;
		res.render('index', { user: req.user });
	}
];

export const homePost = [
	(req: Request, _res: Response, next: NextFunction) => {
		req.body.title = req.body.title.trim();
		next();
	},
	(req: Request, res: Response, next: NextFunction) => {
		if (req.body.title !== '') {
			return next();
		}
		return res.redirect('/' + (req.body.filter || ''));
	},
	(req: Request, res: Response, next: NextFunction) => {
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
];

export const homeIdPost = [
	(req: Request, _res: Response, next: NextFunction) => {
		req.body.title = req.body.title.trim();
		next();
	},
	(req: Request, res: Response, next: NextFunction) => {
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
	(req: Request, res: Response, next: NextFunction) => {
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
];

export const homeIdDeletePost = (
	req: Request,
	res: Response,
	next: NextFunction
) => {
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
};
