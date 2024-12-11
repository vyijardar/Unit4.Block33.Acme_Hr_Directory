const pg = require('pg');
const express = require('express');
const client = new pg.Client(process.env.DATABASE_URL,'postgres://localhost/acme_hr_directory');
const app = express();

app.use(express.json());
app.use(require('morgan')('dev'));

app.get('/api/departments/',async (req,res,next) => {
    try {
        let SQL =`SELECT * FROM departments;`;
        const response = await client.query(SQL);
        res.send(response.rows);
    } catch (ex) {
        next(ex)
    }
})
app.get('/api/employees/',async (req,res,next) => {
    try {
        let SQL =`SELECT * FROM employees; `;
        const response = await client.query(SQL);
        res.send(response.rows);
    } catch (ex) {
        next(ex)
    }
});
app.post('/api/employees/',async (req,res,next) => {
    try {
        let SQL =`INSERT INTO employees(name,department_id) VALUES($1,$2) RETURNING *; `;
        const response = await client.query(SQL,[req.body.name,req.body.department_id]);
        res.send(response.rows[0]);
    } catch (ex) {
        next(ex)
    }
});
app.put('/api/employees/:id',async (req,res,next) => {
    try {
        let SQL =`
        UPDATE employees 
        SET name=$1,department_id=$2
        WHERE id=$3 RETURNING *; `;
        const response = await client.query(SQL,[req.body.name,req.body.department_id,req.params.id]);
        res.send(response.rows[0]);
    } catch (ex) {
        next(ex)
    }
});
app.delete('/api/employees/:id',async (req,res,next) => {
    try {
        let SQL =`DELETE FROM employees WHERE id=$1`;
        const response = await client.query(SQL,[req.params.id]);
        res.sendStatus(204);
    } catch (ex) {
        next(ex)
    }
})
const init = async () => {
    await client.connect();
    let SQL = `
    DROP TABLE IF EXISTS departments CASCADE;
    CREATE TABLE departments 
    (id SERIAL PRIMARY KEY, name VARCHAR(50));

     DROP TABLE IF EXISTS employees CASCADE;
     CREATE TABLE employees
     (id SERIAL PRIMARY KEY,
     name VARCHAR(50),
     created_at TIMESTAMP DEFAULT now(),
     updated_at TIMESTAMP DEFAULT now(),
     department_id INTEGER REFERENCES departments(id) NOT NULL);

     INSERT INTO departments(name) VALUES('Sales');
     INSERT INTO departments(name) VALUES('IT');
     INSERT INTO departments(name) VALUES('HR');
     INSERT INTO departments(name) VALUES('Finance');

     INSERT INTO employees (name,department_id) VALUES('John',(SELECT id FROM departments WHERE name='Sales'));
     INSERT INTO employees (name,department_id) VALUES('Jane',(SELECT id FROM departments WHERE name='IT'));
     INSERT INTO employees (name,department_id) VALUES('Bob',(SELECT id FROM departments WHERE name='HR'));
     INSERT INTO employees (name,department_id) VALUES('Alice',(SELECT id FROM departments WHERE name='IT'));
     INSERT INTO employees (name,department_id) VALUES('Charlie',(SELECT id FROM departments WHERE name='Finance'));
     INSERT INTO employees (name,department_id) VALUES('Emily',(SELECT id FROM departments WHERE name='Sales'));
    `;
    await client.query(SQL);
    const port = process.env.PORT || 3000;
    app.listen(port,()=>console.log(`listening to port ${port}`));
}

init();