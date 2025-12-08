import User from '../models/User.js';
export const ensureAdminAccount = async ({ email, password, name, area, workOrSchool, }) => {
    const existing = await User.findOne({ email }).select('+password');
    if (!existing) {
        return User.create({
            email,
            password,
            username: name,
            area,
            workOrSchool,
            isAdmin: true,
        });
    }
    let needsSave = false;
    if (!existing.isAdmin) {
        existing.isAdmin = true;
        needsSave = true;
    }
    if (!existing.username) {
        existing.username = name;
        needsSave = true;
    }
    if (area && !existing.area) {
        existing.area = area;
        needsSave = true;
    }
    if (workOrSchool && !existing.workOrSchool) {
        existing.workOrSchool = workOrSchool;
        needsSave = true;
    }
    const passwordMatches = await existing.comparePassword(password);
    if (!passwordMatches) {
        existing.password = password;
        needsSave = true;
    }
    if (needsSave) {
        await existing.save();
    }
    return existing;
};
export default ensureAdminAccount;
//# sourceMappingURL=adminAccount.js.map