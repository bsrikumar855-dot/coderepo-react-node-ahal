import { MockOrderModel, MockUserModel } from "./mock-target.model.js";

export const mockTargetRepository = {
	createUser(ownerId, payload) {
		return MockUserModel.create({ ownerId, ...payload });
	},
	listUsers(ownerId) {
		return MockUserModel.find({ ownerId }).sort({ createdAt: -1 }).limit(50);
	},
	findUser(id, ownerId) {
		return MockUserModel.findOne({ _id: id, ownerId });
	},

	createOrder(ownerId, payload) {
		return MockOrderModel.create({ ownerId, ...payload });
	},
	findOrder(id, ownerId) {
		return MockOrderModel.findOne({ _id: id, ownerId });
	},
	setOrderStatus(id, ownerId, status) {
		return MockOrderModel.findOneAndUpdate({ _id: id, ownerId }, { status }, { new: true });
	},
};
