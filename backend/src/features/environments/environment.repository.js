import { EnvironmentModel } from "./environment.model.js";

export const environmentRepository = {
	list(ownerId) {
		return EnvironmentModel.find({ ownerId }).sort({ name: 1 });
	},
	findById(id, ownerId) {
		return EnvironmentModel.findOne({ _id: id, ownerId });
	},
	findActive(ownerId) {
		return EnvironmentModel.findOne({ ownerId, isActive: true });
	},
	create(ownerId, { name, variables }) {
		return EnvironmentModel.create({ ownerId, name, variables: variables || [] });
	},
	update(id, ownerId, updates) {
		return EnvironmentModel.findOneAndUpdate({ _id: id, ownerId }, updates, { new: true, runValidators: true });
	},
	delete(id, ownerId) {
		return EnvironmentModel.findOneAndDelete({ _id: id, ownerId });
	},
	async activate(id, ownerId) {
		const target = await EnvironmentModel.findOne({ _id: id, ownerId });
		if (!target) return null;
		await EnvironmentModel.updateMany({ ownerId, _id: { $ne: id } }, { isActive: false });
		target.isActive = true;
		await target.save();
		return target;
	},
};
