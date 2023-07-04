require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const app = express();
const { migration, db } = require('./db');

const port = process.env.PORT || 3030;
const host = process.env.HOST || 'localhost';

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const VALIDDAY = ["monday", "tuesday", "wednesday", "thursday", "friday"]

// routes
app.get('/hello', (req, res) => {
    res.json({ message: 'Hello world' });
});

//checkin email
app.post('/checkin', async (req, res) => {
    const { email } = req.body;

    if( email == "" ) {
        return res.status(400).json({
            status: "Bad Request",
            message: "Email is required",
        });
    }

    if(!validateEmail(email)) {
        return res.status(400).json({
            status: "Bad Request",
            message: "Invalid email"
        });
    }

    const insertQuery = 
    `
        INSERT INTO users (email) VALUES (?)
    `;

    const [rows] = await db.query(insertQuery, [email]);

    const selectQuery = 
    `
        SELECT * FROM users WHERE id = ?
    `;

    const [row] = await db.query(selectQuery, [rows.insertId]);

    res.status(200).json({
        status: 'Success',
        message: 'Success',
        data: {...row[0]},
    });
});

function validateEmail(email) {
    var regex = /^[\w\.-]+@[\w\.-]+\.\w+$/;
    return regex.test(email);
}

//get schedule
app.get('/schedule', async (req, res) => {
    const query = req.query;

    if(query.hasOwnProperty("day")) {
        const { email, day } = query;
        
        getDetailSchedule(res, email, day);
    } else {
        const { email } = query;

        getAllSchedule(res, email);
    }
});

//get all schedule
const getAllSchedule = async (res, email) => {
    const dates = {
        "monday": [],
        "tuesday": [],
        "wednesday": [],
        "thursday": [],
        "friday": [],
    };

    if (!email){
        return res.status(400).json({
            status: "Bad Request",
            message: "Email is required",
        });
    }if (!validateEmail(email)){
        return res.status(400).json({
            status: "Bad Request",
            message: "Invalid email",
        });
    }

    const selectUserQuery =
    `
        SELECT id FROM users WHERE email = ?
    `;

    const [user] = await db.query(selectUserQuery, [email]);
    if( user.length == 0 ) {
        return res.status(404).json({
            status: "Not Found",
            message: "Email is not found",
        });
    };
    const selectQuery =
    `
        SELECT * FROM schedules WHERE user_id = ?
    `;

    const [rows] = await db.query(selectQuery, [user[0].id]);
    rows.forEach(row => {
        dates[row.day].push(row);
    });

    res.status(200).json({
        status: 'Success',
        message: 'Success',
        data: {...dates},
    });
}

//get detail schedule
const getDetailSchedule = async (res, reqemail, day) => { 
    if (!VALIDDAY.includes(day)){
        return res.status(400).json({
            status: "Bad Request",
            message: "Day is invalid",
        });
    }

    if (!reqemail){
        return res.status(400).json({
            status: "Bad Request",
            message: "Email is required",
        });
    }

    if (!validateEmail(reqemail)){
        return res.status(400).json({
            status: "Bad Request",
            message: "Invalid email",
        });
    }
    
    const selectUserQuery =
    `
        SELECT id FROM users WHERE email = ?
    `;

    const [user] = await db.query(selectUserQuery, [reqemail]);
    if( user.length == 0 ) {
        return res.status(404).json({
            status: "Not Found",
            message: "Email is not found",
        });
    };
    const selectQuery =
    `
        SELECT * FROM schedules WHERE user_id = ? AND day = ?
    `;

    const [rows] = await db.query(selectQuery, [user[0].id, day]);

    res.status(200).json({
        status: 'Success',
        message: 'Success',
        data: {...rows},
    });
}

//add schedule
app.post('/schedule', async (req, res) => {
    const { email } = req.query;
    const { title, day } = req.body;

    if( title == "") {
        return res.status(400).json({
            status: "Bad Request",
            message: "Title is required",
        });
    };
    if( email == "") {
        return res.status(400).json({
            status: "Bad Request",
            message: "Email is required",
        });
    };
    if( day == "") {
        return res.status(400).json({
            status: "Bad Request",
            message: "Day is required",
        });
    };
    if (!validateEmail(email)){
        return res.status(400).json({
            status: "Bad Request",
            message: "Invalid email",
        });
    }

    if (!VALIDDAY.includes(day)){
        return res.status(400).json({
            status: "Bad Request",
            message: "Day is invalid",
        });
    }
    const selectUserQuery = 
    `
        SELECT id FROM users WHERE email = ?
    `

    const [user] = await db.query(selectUserQuery, [email]);
    if( user.length == 0 ) {
        return res.status(404).json({
            status: "Not Found",
            message: "Email is not found",
        });
    };

    const insertQuery = 
    `
        INSERT INTO schedules (user_id, title, day) VALUES (?, ?, ?)
    `;

    const [rows] = await db.query(insertQuery, [user[0].id, title, day]);

    const selectQuery =
    `
        SELECT * FROM schedules WHERE id = ?
    `;

    const [row] = await db.query(selectQuery, [rows.insertId]);

    res.status(201).json({
        status: 'Success',
        message: 'Success',
        data: {...row[0]},
    });
});

//edit schedule
app.patch('/schedule', async (req, res) => {
    const { email, id } = req.query;
    const { title } = req.body;

    if (!email){
        return res.status(400).json({
            status: "Bad Request",
            message: "Email is required",
        });
    }if (!validateEmail(email)){
        return res.status(400).json({
            status: "Bad Request",
            message: "Invalid email",
        });
    } if (!title){
        return res.status(400).json({
            status: "Bad Request",
            message: "Title is required"
        })
    }

    const selectUserQuery =
    `
        SELECT id FROM users WHERE email = ?
    `;

    const [user] = await db.query(selectUserQuery, [email]);
    if( user.length == 0 ) {
        return res.status(404).json({
            status: "Not Found",
            message: "Email is not found",
        });
    };
    const checkQuery = 
    `
        SELECT user_id FROM schedules WHERE id = ?
    `;

    const [check] = await db.query(checkQuery, [id]);

    if(check.length == 0) {
        return res.status(404).json({
            status: "Not Found",
            message: `Schedule with ID ${id} Not Found`,
        });
    }

    if(check[0].user_id != user[0].id) {
        return res.status(403).json({
            status: "Forbidden",
            message: "Access denied!",
        });
    }

    const updateQuery =
    `
        UPDATE schedules SET title = ? WHERE id = ?
    `;

    const [rows] = await db.query(updateQuery, [title, id]);

    const selectQuery =
    `
        SELECT * FROM schedules WHERE id = ?
    `;

    const [row] = await db.query(selectQuery, [id]);

    res.status(201).json({
        status: 'Success',
        message: 'Success',
        data: {...row[0]},
    });

});

//delete schedule
app.delete('/schedule', async (req, res) => {
    const { email, id } = req.query;
    if( email == "") {
        return res.status(400).json({
            status: "Bad Request",
            message: "Email is required",
        });
    };
    if (!validateEmail(email)){
        return res.status(400).json({
            status: "Bad Request",
            message: "Invalid email",
        });
    }
    const selectUserQuery =
    `
        SELECT id FROM users WHERE email = ?
    `;

    const [user] = await db.query(selectUserQuery, [email]);
    if( user.length == 0 ) {
        return res.status(404).json({
            status: "Not Found",
            message: "Email is not found",
        });
    };
    const checkQuery =
    `
        SELECT user_id FROM schedules WHERE id = ?
    `;

    const [check] = await db.query(checkQuery, [id]);

    if(check.length == 0) {
        return res.status(404).json({
            status: "Not Found",
            message: `Schedule with ID ${id} Not Found`,
        });
    }

    if(check[0].user_id != user[0].id) {
        return res.status(403).json({
            status: "Forbidden",
            message: "Access denied!",
        });
    }

    const deleteQuery =
    `
        DELETE FROM schedules WHERE id = ?
    `;

    const [rows] = await db.query(deleteQuery, [id]);

    res.status(200).json({
        status: 'Success',
        message: 'Success',
        data: {}
    });

});

// 404 endpoint middleware
app.all('*', (req, res) => {
    res.status(404).json({ message: `${req.originalUrl} not found!` });
});

// error handler
app.use((err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    return res.status(err.statusCode).json({
        status: err.status,
        message: err.message || 'An error occurred.',
    });
});

const run = async () => {
    await migration(); // 👈 running migration before server
    app.listen(port); // running server
    console.log(`Server run on http://${host}:${port}/`);
};

run();
