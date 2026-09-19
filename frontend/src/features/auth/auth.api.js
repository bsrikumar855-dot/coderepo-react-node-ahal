import { get, post } from "../../shared/api/client.js";

export const authApi = {
	register: (name, email, password) => post("/auth/register", { name, email, password }),
	login: (email, password) => post("/auth/login", { email, password }),
	session: () => get("/auth/session"),
	logout: () => post("/auth/logout"),
};
