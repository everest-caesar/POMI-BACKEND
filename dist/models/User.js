import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
    },
    username: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false, // Don't include password by default in queries
    },
    age: {
        type: Number,
        min: [13, 'You must be at least 13 years old'],
        max: [120, 'Please enter a valid age'],
    },
    area: {
        type: String,
        trim: true,
        enum: [
            'Downtown Ottawa',
            'Barrhaven',
            'Kanata',
            'Nepean',
            'Gloucester',
            'Orleans',
            'Vanier',
            'Westboro',
            'Rockcliffe Park',
            'Sandy Hill',
            'The Glebe',
            'Bytown',
            'South Ottawa',
            'North Ottawa',
            'Outside Ottawa',
        ],
    },
    workOrSchool: {
        type: String,
        trim: true,
    },
    isAdmin: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});
// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password'))
        return next();
    try {
        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = await bcryptjs.hash(this.password, salt);
        this.password = hashedPassword;
        next();
    }
    catch (error) {
        next(error);
    }
});
// Method to compare passwords
userSchema.methods.comparePassword = async function (passwordAttempt) {
    return await bcryptjs.compare(passwordAttempt, this.password);
};
const User = mongoose.model('User', userSchema);
export default User;
//# sourceMappingURL=User.js.map