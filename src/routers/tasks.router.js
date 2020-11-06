const express = require('express')
const Task = require('../models/task')
const auth = require('../middleware/auth')
const UserRouter = require('./users.router')
const multer = require('multer')


const TaskRouter = new express.Router()


TaskRouter.post('/tasks', auth, async (req, res) => {
    const task =  new Task({
        ...req.body,
        owner: req.user._id
    });

    try {
        await task.save()
        res.status(201).send(task)
    } catch (error) {
        res.status(400).send('You done goofed, please check that all the feilds are valid and dont goof no more')
    }

})



TaskRouter.get('/tasks', auth, async (req, res) => {
    const match = {}
    const sort = {}

    if(req.query.completed){
        match.completed = req.query.completed === 'true'
    }
    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }

    try {
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit) || 10,
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate()
        res.send(req.user.tasks)
    } catch (error) {
        res.status(500).send('the server has goofed, we are sorry. please try again later')
    }

})

TaskRouter.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id
    try {
        const task = await Task.findOne({_id, owner: req.user._id})

        if(!task){
            return res.status(404).send('task was not found')
        }
        res.send(task)
    } catch (error) {
        res.status(500).send('the server has goofed, we are sorry. please try again later')
    }
})

TaskRouter.patch('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id
    const updates = req.body
    const validUpdates = ['description', 'completed']
    const isUpdatesValid = Object.keys(updates).every( update => {
        return validUpdates.includes(update)
    })
    if (!isUpdatesValid) {
        return res.status(404).send({ error: 'invalid update'})
    }

    try {
        const taskToUpdate = await Task.findOne({_id, owner: req.user._id})

        Object.keys(updates).forEach( update => {
            taskToUpdate[update] = updates[update]
        })

        await taskToUpdate.save()

        if(!taskToUpdate){
            return res.status(400).send('you done goofed, the task you are trying to update is not found ')
        }
        res.send(taskToUpdate)
    } catch (error) {
        res.status(400).send('yet again, you goofed')
    }
})

TaskRouter.delete('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id

    try {
        const deletedTask = await Task.findOneAndDelete({_id, owner: req.user._id})
        if (!deletedTask) {
            return res.status(400).send('task was not found')
        }
        res.send('the task has been deleted')
    } catch (error) {
        res.send(400).send('ooops..')
    }
})

const avatar = multer({
    dest: 'avatars'
})

UserRouter.post('user/me/avatar', avatar.single('avatar'), (req, res) => {
    res.send()
})

module.exports = TaskRouter