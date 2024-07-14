export interface Todo {
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
