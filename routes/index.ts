import express from 'express';
import { Strategy as LocalStrategy } from 'passport-local';
import { signupGet, signupPost } from './signup';
import { verify } from '../middlewares';
import { loginGet } from './login';
import { activeGet } from './active';
import { homeGet, homeIdDeletePost, homeIdPost, homePost } from './home';
import { completedGet } from './completed';
import { logoutPost } from './logout';
import { toggleAllPost } from './toggle';
import { clearCompletedPost } from './clear';
import passport from 'passport';

const router = express.Router();

passport.serializeUser((user: Express.User, cb) => {
	process.nextTick(() => {
		cb(null, { id: user.id, username: user.username });
	});
});

passport.deserializeUser((user: Express.User, cb) => {
	process.nextTick(() => {
		return cb(null, user);
	});
});

passport.use(new LocalStrategy(verify));

router.get('/', homeGet);
router.get('/login', loginGet);
router.get('/signup', signupGet);
router.get('/active', activeGet);
router.get('/completed', completedGet);

router.post('/', homePost);
router.post('/signup', signupPost);
router.post('/logout', logoutPost);
router.post('/:id(\\d+)', homeIdPost);
router.post('/:id(\\d+)/delete', homeIdDeletePost);
router.post('/toggle-all', toggleAllPost);
router.post('/clear-completed', clearCompletedPost);
router.post(
	'/login/password',
	passport.authenticate('local', {
		successRedirect: '/',
		failureRedirect: '/login'
	})
);

export default router;
