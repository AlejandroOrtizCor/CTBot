-- This is the file to create the database for using the bot

create database CTBot;

use CTBot;

CREATE TABLE configs (
	prefix varchar(2),
	dev int
);

CREATE TABLE map (
	mapa varchar(50),
	server varchar(50)
);

CREATE TABLE users (
	id varchar(100) NOT NULL,
	'profile' varchar(100) NOT NULL
);