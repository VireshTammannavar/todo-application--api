const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log(`Server Running at http://localhost:3000/`);
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

// get todo api on specific query api 1
const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};
const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};
app.get("/todos/", async (request, response) => {
  const { search_q = "", priority, status } = request.query;
  let dbResponse = null;
  let getTodoQuery = "";
  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodoQuery = `select * from todo
        where priority='${priority}' 
        and
        status='${status}' and
        todo like '%${search_q}%';`;
      break;
    case hasPriorityProperty(request.query):
      getTodoQuery = `select * from todo
        where priority='${priority}' 
        and todo like '%${search_q}%';`;
      break;
    case hasStatusProperty(request.query):
      getTodoQuery = `select * from todo 
        where status='${status}' and 
        todo like '%${search_q}%';`;
      break;
    default:
      getTodoQuery = `select * from todo 
            where todo like '%${search_q}%';`;
  }
  dbResponse = await db.all(getTodoQuery);
  response.send(dbResponse);
});

// get todo based on todo Id api 2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `select * from todo
    where id=${todoId};`;
  const getDbResponse = await db.get(getTodoQuery);
  response.send(getDbResponse);
});

// post api 3
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const postQuery = `insert into
    todo(id,todo,priority,status) values
    (${id},'${todo}','${priority}','${status}');`;
  await db.run(postQuery);
  response.send("Todo Successfully Added");
});

// put api 4
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const { status = "", priority = "", todo = "" } = request.body;
  let dbQuery = "";
  switch (true) {
    case status !== "":
      dbQuery = `update todo
        set status='${status}' 
        where id=${todoId};`;
      await db.run(dbQuery);
      response.send("Status Updated");
      break;
    case priority !== "":
      dbQuery = `update todo 
        set priority='${priority}' 
        where id=${todoId};`;
      await db.run(dbQuery);
      response.send("Priority Updated");
      break;
    default:
      dbQuery = `update todo 
        set todo='${todo}' 
        where id=${todoId};`;
      await db.run(dbQuery);
      response.send("Todo Updated");
  }
});

// delete api 5
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `delete 
    from todo where id=${todoId};`;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
