interface EnsureAdminOptions {
    email: string;
    password: string;
    name: string;
    area?: string;
    workOrSchool?: string;
}
export declare const ensureAdminAccount: ({ email, password, name, area, workOrSchool, }: EnsureAdminOptions) => Promise<import("mongoose").Document<unknown, {}, import("../models/User.js").IUser, {}, {}> & import("../models/User.js").IUser & Required<{
    _id: string;
}> & {
    __v: number;
}>;
export default ensureAdminAccount;
//# sourceMappingURL=adminAccount.d.ts.map