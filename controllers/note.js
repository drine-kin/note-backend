const Note = require('../models/note')
const User = require('../models/user')

const noteRouter = require('express').Router()

const jwt = require('jsonwebtoken')

const getTokenFrom = request => {
    const authorization = request.get('authorization')
    if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
        return authorization.substring(7)
    }
    return null
}

noteRouter.get('/', async (request, response) => {
    const notes = await Note.find({}).populate('users', {username: 1, name: 1})
    response.json(notes)
})

noteRouter.post('/', async (request, response) => {
    const body = request.body

    const token = getTokenFrom(request)
    //console.log('tokennnnnn',token)
    const decodedToken = jwt.verify(token, process.env.SECRET) 
    //console.log('decoded token ',decodedToken)
    if(!token || !decodedToken.id ){
        return response.status(401).json({ error: 'token missing or invalid'})
    }

    //const user = await User.findById(body.userId)
    const user = await User.findById(decodedToken.id)

    const note = new Note({
        content: body.content,
        date: new Date(),
        important: body.important === undefined ? false :body.important,
        user: user._id
    })

    const savedNote = await note.save()
    user.notes = user.notes.concat(savedNote._id)
    await user.save()
    response.json(savedNote)
    
})

noteRouter.get('/:id', async (request, response) => {
    const id = request.params.id
    const note = await Note.findById(id)
    response.json(note)
})

noteRouter.delete('/:id', async (request, response) => {

    const token = getTokenFrom(request)
    const decodedToken = jwt.verify(token, process.env.SECRET) 
    if(!token || !decodedToken.id ){
        return response.status(401).json({ error: 'token missing or invalid'})
    }
    const id = request.params.id
    const note = await Note.findById(id)
    if(note.user.toString() === decodedToken.id.toString()){
        await Note.findByIdAndDelete(id)
        response.status(204).send()
    }else{
        response.status(401).json({error: "this note can only delete by creator"})
    }
})

noteRouter.put('/:id', async( request, response ) => {

    const token = getTokenFrom(request)
    const decodedToken = jwt.verify(token, process.env.SECRET) 
    if(!token || !decodedToken.id ){
        return response.status(401).json({ error: 'token missing or invalid'})
    }

    const id = request.params.id
    const note = await Note.findById(id)
    if(note.user.toString() === decodedToken.id.toString()){
        const body = request.body
        const newNote = new Note({
            _id:id,
            content: body.content,
            date: new Date(),
            important: body.important,
        })
        //console.log('newnoteeeee',newNote)
        const changedNote = await Note.findByIdAndUpdate(id, {$set:newNote}, {new: true})
        response.json(changedNote)
    }else{
        response.status(401).json({error: "this note can only update by creator"})
    }
    
})



module.exports = noteRouter