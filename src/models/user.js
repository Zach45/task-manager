const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('./task')



const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    age: {
        type: Number,
        default: 0,
        Validite(value) {
            if(value < 0){
                throw new Error('Age must be a positive number')
            }
        }
    },
    email:{
        type: String,
        unique: true,
        require: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('the email you entered is invalid')
            }
        }        
    },
    password:{
        type: String,
        required: true,
        trim: true,
        minlength: 7,
        validate(value){
            if (value.toLowerCase().includes('password')){
                throw new Error('password contains "password"')
            }
        }         

    },
    tokens: [{
        token:{
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    }
}, {
    timestamps:true
})

userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField:'owner'
})

userSchema.methods.generateAuthToken = async function () {
    const user = this
    const token = jwt.sign({_id: user._id.toString() }, process.env.JWT_SECRET)

    user.tokens = user.tokens.concat({ token })
    await user.save()

    return token
}

userSchema.methods.toJSON = function () {
    const user = this 
    const publicUser = user.toObject()
    

    delete publicUser.password
    delete publicUser.tokens
    delete publicUser.avatar

    return publicUser
}

userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email })
    if (!user) {
    throw new Error('Unable to login')
    }
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
    throw new Error('Unable to login')
    }
    return user
   }

//hash the plain text password before saving
userSchema.pre('save', async function(next){
    const user = this
    
    if(user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }

    next()
})

// delete all tasks of the deleted user
userSchema.pre('remove', async function(next){
    const user = this 
    await Task.deleteMany({owner: user._id})

    next()
})

const User = mongoose.model('User', userSchema)

module.exports = User