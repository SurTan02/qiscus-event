const mysql = require('mysql2/promise');

const db = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    database: process.env.MYSQL_DBNAME || 'skyshi_qiscus',
    password: process.env.MYSQL_PASSWORD || '13520059',
    waitForConnections: false,
    connectionLimit: 100,
    queueLimit: 0,
});

const migration = async () => {
    try {
        //query mysql untuk membuat table user
        await db.query(
            `
            CREATE TABLE IF NOT EXISTS users(
                id int not null auto_increment,
                email varchar(255) not null,
                createdAt timestamp default current_timestamp,
                updatedAt timestamp default current_timestamp on update current_timestamp,
                primary key (id)
            )
        `
        )

        //query mysql untuk membuat table schedule
        await db.query(
            `
            CREATE TABLE IF NOT EXISTS schedules(
                id int not null auto_increment,
                user_id int not null,
                title varchar(255) not null,
                day varchar(255) not null,
                createdAt timestamp default current_timestamp,
                updatedAt timestamp default current_timestamp on update current_timestamp,
                primary key (id)
            )
        `
        )

        console.log('Running Migration Successfully!');
    } catch (err) {
        throw err;
    }
};

module.exports = { db, migration };
