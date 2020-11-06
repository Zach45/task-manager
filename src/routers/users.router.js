const express = require('express')
const User = require('../models/user')
const UserRouter = new express.Router()
const auth = require('../middleware/auth')
const multer = require('multer')
const sharp = require('sharp')
const { sendWelcomeEmail, sendCancelationEmail } = require('../emails/account')


UserRouter.post('/users', async (req, res) => {
    try {
        const user = new User(req.body);
        await user.save()
        sendWelcomeEmail(user.email, user.name)
        const token = await user.generateAuthToken()
        res.status(201).send({user, token})
    } catch (error) {
        res.status(401).send(error.message)
    }
})

UserRouter.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()

        res.send( {user, token } )
    } catch (error) {
        res.status(400).send('not working')
    }
})

UserRouter.post('/users/logout', auth, async (req,res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save()

        res.send()
    } catch (error) {
        res.status(500).send('the server has goofed once more')
    }
})

UserRouter.post('/users/logoutAll', auth, async (req,res) => {
    try {
        req.user.tokens = []
        
        await req.user.save()

        res.send()
    } catch (error) {
        res.status(500).send('the server has goofed once more')
    }
})

UserRouter.get('/users/me', auth, async (req, res) => {
    res.send(req.user)
})


UserRouter.patch('/users/me', auth, async (req, res) => {
    const updates = req.body
    const validUpdates = ['name', 'age', 'email', 'password']
    const isUpdates = Object.keys(updates).every( update => {
        return validUpdates.includes(update)
    })

    if (!isUpdates) {
        return res.status(400).send({error: 'invalidfield'})
    }
    

    try {
        Object.keys(updates).forEach( update => {
            req.user[update] = updates[update]
        })

        await req.user.save()


        res.send(req.user)
    } catch (error) {
        res.status(400).send('you done goofed')
    }
})

UserRouter.delete('/users/me', auth, async (req, res) => {

    try {
        await req.user.remove()
        sendCancelationEmail(req.user.email, req.user.name)
        res.send('the user has been deleted')
    } catch (error) {
        res.send(400).send('ooops..')
    }
})

const avatar = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb){
        if (!file.originalname.match(/\.(png|jpg|jpeg)/)) {
            return cb(new Error('please upload an image'))
        }
        cb(undefined, true)
    }
})
UserRouter.post('/users/me/avatar', auth, avatar.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250}).png().toBuffer()

    req.user.avatar = buffer
    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({Error: error.message})
})

UserRouter.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({Error: error.message})
})

UserRouter.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        if (!user || !user.avatar) {
            throw new Error
        }

        res.set('Content-Type', 'image/png')
        res.send(user.avatar)
    } catch (error) {
        res.status(404).send()
    }
})
module.exports = UserRouter