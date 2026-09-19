import { AccountModel } from "./account.model.js";

export const authRepository = {
	findByEmail(email) {
		return AccountModel.findOne({ email: email.toLowerCase().trim() });
	},
	findById(id) {
		return AccountModel.findById(id);
	},
	create({ name, email, passwordHash }) {
		return AccountModel.create({ name, email: email.toLowerCase().trim(), passwordHash });
	},
};
