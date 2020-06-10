const express = require('express')
const {v4: uuid }= require('uuid')
const { isWebUri } = require('valid-url')
const logger = require('../logger')
const BookmarksService = require('./bookmark-service')
const xss = require('xss')
const path = require('path')


const bookmarksRouter = express.Router()
const bodyParser = express.json()

const serializeBookmark = bookmark => ({
  id: bookmark.id,
  title: xss(bookmark.title),
  url: xss(bookmark.url),
  description: xss(bookmark.description),
  rating: Number(bookmark.rating),
})

//create the route for bookmarks
bookmarksRouter
  .route('/api/bookmarks')
  .get((req, res, next) => {
    BookmarksService.getAllBookmarks(req.app.get('db'))
    .then(bookmarks =>{
      res
      .status(200)
      .json(bookmarks.map(serializeBookmark))
    })
    .catch(next)
  })
  .post(bodyParser, (req, res, next) => {
    for (const input of ['title', 'url', 'rating']) {
      if (!req.body[input]) {
        logger.error(`${input} is required`)
        return res.status(400).send(`'${input}' is required`)
      }
    }
    const { title, url, description } = req.body
    const rating = Number(req.body.rating)

    if (!Number.isInteger(rating) || rating < 0 || rating > 5) {
      logger.error(`Invalid rating: ${rating}`)
      return res.status(400).send(`the rating must be between 0 and 5`)
    }

    if (!isWebUri(url)) {
      logger.error(`Invalid url: ${url}`)
      return res
              .status(400)
              .send(`url must be valid`)
    }

    const newBookmark = { 
      title, 
      url, 
      description, 
      rating
    }

    //store.bookmarks.push(bookmark)

    logger.info(`Bookmark with id ${newBookmark.id} created`)

    BookmarksService.insertBookmark(req.app.get('db'), newBookmark)
      .then(newBookmark =>{
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${newBookmark.id}`))
          .json(newBookmark)
      })
      .catch(next)
})
    

//create the routes for bookmarks/id
bookmarksRouter
  .route('/api/bookmarks/:bookmark_id')
  .get((req, res, next) => {
    const { bookmark_id } = req.params
    BookmarksService.getById(req.app.get('db'), bookmark_id)
      .then(bookmark =>{
        if (!bookmark) {
          logger.error(`Bookmark with id ${bookmark_id} not found.`)
          return res
            .status(404)
            .send('Bookmark Not Found')
        }
        res.json(serializeBookmark(bookmark))
      })
      .catch(next)
  })
  .delete((req, res) => {
    const { bookmark_id } = req.params

    if (bookmark_id === -1) {
      logger.error(`Bookmark with id ${bookmark_id} not found.`)
      return res
        .status(404)
        .send('Bookmark not found')
    }
    //const newStore = store.bookmarks.filter(item => item.id !== bookmark_id)
    //store.bookmarks = newStore

    logger.info(`Bookmark with id ${bookmark_id} was successfully deleted.`)

    BookmarksService.deleteBookmark(req.app.get('db'), bookmark_id)
      .then(()=>{
        res
        .status(204)
        .end()
      })
  })
  .patch(bodyParser, (req, res, next) =>{
    const { title, url, description, rating }= req.body
    const bookmarkToUpdate = { title, url, description, rating }

    const numberOfValues = Object.values(bookmarkToUpdate).filter(boolean).length
    if (numberOfValues === 0){
      return res.status(400).json({
        error: {
          message: `Request body must contain either 'title', 'url', 'description', or 'rating'`
        }
      })
    }

    BookmarksService.updateBookmark(
      req.app.get('db'),
      req.params.bookmark_id,
      bookmarkToUpdate
    )
  })

module.exports = bookmarksRouter