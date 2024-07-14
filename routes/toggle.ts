import { Request, Response, NextFunction } from 'express';
import db from '../db';

export const toggleAllPost = (
	req: Request,
	res: Response,
	next: NextFunction
) => {
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
};
