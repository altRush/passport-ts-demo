import { Request, Response, NextFunction } from 'express';
import db from '../db';

export const clearCompletedPost = (
	req: Request,
	res: Response,
	next: NextFunction
) => {
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
};
