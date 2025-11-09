import mongoose from 'mongoose';
export interface IUser {
    _id: string;
    email: string;
    password: string;
    username: string;
    age?: number;
    area?: string;
    workOrSchool?: string;
    isAdmin: boolean;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(password: string): Promise<boolean>;
}
declare const User: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser, {}, {}> & IUser & Required<{
    _id: string;
}> & {
    __v: number;
}, any>;
export default User;
//# sourceMappingURL=User.d.ts.map