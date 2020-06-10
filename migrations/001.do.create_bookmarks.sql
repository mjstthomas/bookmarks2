create table bookmarks(
    id serial not null,
    title text not null,
    url text not null,
    description text,
    rating integer not null
);