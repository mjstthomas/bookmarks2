const BookmarksService = {
    getAllBookmarks(knex) {
        return knex.select('*')
            .from('bookmarks')
            // .then(result =>{
            //     console.log(result)
            // })
    },
    getById(knex, id){
        return knex
        .from('bookmarks')
        .select('*')
        .where('id', id)
        .first()
    },
    insertBookmark(knex, newBookmark){
        return knex.insert(newBookmark)
        .into('bookmarks')
        .returning('*')
        .then(rows =>{
            return rows[0]
        })
    },
    deleteBookmark(knex, id){
        return knex('bookmarks')
        .where({id})
        .delete()
    },
    updateBookmark(knex, id , newBookmarkField){
        return knex('bookmarks')
        .where({id})
        .update(newBookmarkField)
    }
}

module.exports= BookmarksService