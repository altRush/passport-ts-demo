import { NextFunction, Request, Response } from 'express';
import { fetchTodos } from '../middlewares';
import { Todo } from '../types';

export const completedGet = [
	(req: Request, res: Response, next: NextFunction) => {
		if (!req?.user) {
			return res.render('home');
		}
		next();
	},
	fetchTodos,
	(req: Request, res: Response) => {
		res.locals.todos = (res.locals.todos as Todo[]).filter(todo => {
			return todo.completed;
		});
		res.locals.filter = 'completed';
		res.render('index', { user: req.user });
	}
];
