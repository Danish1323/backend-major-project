// Import mongoose to create User schema and model
const mongoose = require('mongoose');
// Import bcryptjs to hash user passwords before saving
const bcrypt = require('bcryptjs');

// Define the User Schema structure
const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please provide a name'],
            trim: true
        },
        email: {
            type: String,
            required: [true, 'Please provide an email address'],
            unique: true,
            lowercase: true,
            trim: true
        },
        password: {
            type: String,
            required: [true, 'Please provide a password'],
            minlength: [6, 'Password must be at least 6 characters']
        },
        role: {
            type: String,
            enum: ['customer', 'staff', 'kitchen', 'manager', 'admin'],
            default: 'customer'
        }
    },
    {
        timestamps: true // Automatically adds createdAt and updatedAt fields
    }
);

// Mongoose Pre-save Hook: Hashes password before saving to database
userSchema.pre('save', async function (next) {
    // If password field is not modified, proceed to next middleware
    if (!this.isModified('password')) {
        return next();
    }

    // Generate salt with 10 rounds
    const salt = await bcrypt.genSalt(10);
    // Hash the plain text password with the salt
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Helper method to compare entered password with hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Create and export User model
const User = mongoose.model('User', userSchema);
module.exports = User;
