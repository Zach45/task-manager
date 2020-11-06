const express = require('express');
const TaskRouter = require('./routers/tasks.router');
require('./db/mongoose');
const UserRouter = require('./routers/users.router')

const app = express()
const port = process.env.PORT

app.use(express.json())
app.use(UserRouter)
app.use(TaskRouter)

app.listen(port, () => {
    console.log('server is up *.* ')
})