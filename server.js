var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var PORT = process.env.PORT || 3000;
var _ = require('underscore');

var db = require('./db.js');

var todos = [];
var todoNextId = 1;


app.use(bodyParser.json());


app.get('/', function(req, res) {
	res.send('Todo API Root');
	res.end();
});

//GET //todos?completed=false&q=work 
app.get('/todos', function(req, res) {
	var queryParams = req.query;
	var keyWord = queryParams.q;
	var filteredTodos = todos;

	var matchedDescription;
	if (queryParams.hasOwnProperty('completed') && queryParams.completed === 'true') {
		filteredTodos = _.where(filteredTodos, {
			completed: true
		});
	} else if (queryParams.hasOwnProperty('completed') && queryParams.completed === 'false') {
		filteredTodos = _.where(filteredTodos, {
			completed: false
		});
	}
	// if has property && completed === 'true'
	// filteredTodos = _.where(filteredTodos, ?);
	// else if has prop && completed if 'false'

	//"Go to work on Saturday".indexOf('work');
	if (queryParams.hasOwnProperty('q') && queryParams.q.length > 0) {
		filteredTodos = _.filter(filteredTodos, function(todo) {
			// if(element.description.indexOf(keyWord) !== -1){
			// 	return element;
			// } else {
			// 	return {"no element found":"element is not there"};
			// }
			return todo.description.toLowerCase().indexOf(queryParams.q.toLowerCase()) > -1;
		});
	} else {
		return res.status(404).send();
	}

	res.json(filteredTodos);
	res.end();
});
//GET /todos/: id

app.get('/todos/:id', function(req, res) {
	var todoId = parseInt(req.params.id, 10);

	var matchedTodo = _.findWhere(todos, {
		id: todoId
	});


	if (matchedTodo) {
		res.json(matchedTodo);
	} else {
		res.status(404).send();
	}

	res.send('Asking for todos with id of ' + req.params.id);
	res.end();
});


//POST /todos 
app.post('/todos', function(req, res) {
	var body =  _.pick(req.body, 'description','completed'); // use _.pick to only description and completed.

    db.todo.create(body).then(function(todo){
    	res.json(todo.toJSON());
    }, function(e){
    	res.status(400).json(e);
    });


	// db.sync({force:true}).create({
	// 	description : body.description,
	// 	completed : body.completed
	// }).then(function(todo){
	// 	res.status(200).json(todo);
	// }).catch(function(e){
	// 	res.status(200).json(e);
	// });
    // call create on db.todo
    // 	respond with 200 and todo
    // 	e res.status(400).json(e)

	// if (!_.isBoolean(body.completed) || !_.isString(body.description) || body.description.trim().length === 0) {
	// 	return res.status(400).send();
	// }

	// var body = _.pick(body, 'description', 'completed');
	// body.description = body.description.trim();
	// // set body.description to be trimmed value


	// //add id field
	// body.id = todoNextId;
	// todoNextId += 1;

	// //push body into array.
	// todos.push(body);

	// console.log('description:' + body.description);

	// res.json(body);
});

// delete /todos/:id
app.delete('/todos/:id', function(req, res) {

	var todoId = parseInt(req.params.id, 10);
	var matchedEle = _.findWhere(todos, {
		id: todoId
	});

	if (!matchedEle) {
		res.status(404).json({
			"error": "no todo found ! "
		});
	} else {
		todos = _.without(todos, matchedEle);
		res.json(matchedEle);
	}
});

//PUT /todos/:id
app.put('/todos/:id', function(req, res) {
	var todoId = parseInt(req.params.id, 10);
	var body = _.pick(req.body, 'description', 'completed');
	var validAttribute = {};
	var matchedEle = _.findWhere(todos, {
		id: todoId
	});


	if (!matchedEle) {
		return res.status(404).send();
	}


	if (body.hasOwnProperty('completed') && _.isBoolean(body.completed)) {
		validAttribute.completed = body.completed;
	} else if (body.hasOwnProperty('completed')) {
		return res.status(400).send();
	}

	if (body.hasOwnProperty('description') && _.isString(body.description) && body.description.trim().length > 0) {
		validAttribute.description = body.description;
	} else if (body.hasOwnProperty('description')) {
		return res.status(400).send();
	}

	//HERE
	_.extend(matchedEle, validAttribute);
	res.json(matchedEle)

});

db.sequelize.sync().then(function() {
			app.listen(PORT, function() {
				console.log('Express listening on port ' + PORT + '!');
			});
});

