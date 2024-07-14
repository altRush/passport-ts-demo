import { Request, Response } from 'express';

export const loginGet = (_: Request, res: Response) => {
	res.render('login');
};
