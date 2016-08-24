var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var PORT = process.env.PORT || 3000;
var _ = require('underscore');
var bcrypt = require('bcrypt');


var db = require('./db.js');
var todos = [];
var todoNextId = 1;

var middleware = require('./middleware.js')(db);

app.use(bodyParser.json());


app.get('/', function(req, res) {
	res.send('Todo API Root');
	res.end();
});

//GET //todos?completed=false&q=work 
app.get('/todos', middleware.requireAuthentication, function(req, res) {
	var queryParams = req.query;
	var keyWord = queryParams.q;

	var where = {
		userId : req.user.get('id')
	};//find all things to find
					//req.user.get(id)

	var matchedTodos;

	if (queryParams.hasOwnProperty('completed') && queryParams.completed === 'true') {
		where.completed = true;

	} else if (queryParams.hasOwnProperty('completed') && queryParams.completed === 'false') {
		where.completed = false;
	}



	if (queryParams.hasOwnProperty('q') && queryParams.q.length > 0) {
		where.description = {
			$like: '%' + queryParams.q + '%'
		};


	}

	db.todo.findAll({
		where: where
	}).then(function(todos) {
		res.json(todos);
	}, function(e) {
		res.status(500).send();
	});

});
//GET /todos/: id

app.get('/todos/:id', middleware.requireAuthentication, function(req, res) {
	var todoId = parseInt(req.params.id, 10);

	db.todo.findOne({
		where : {
			id : todoId,
			userId : req.user.get('id')
		}
	}).then(function(mytodo) {//findOne. where id === id passed in
		if (!!mytodo) {
			res.json(mytodo.toJSON());
		} else {
			res.status(404).send();
		}
	}, function(e) {
		res.status(500).send();
	});

});


//POST /todos 
app.post('/todos', middleware.requireAuthentication, function(req, res) {
	var body = _.pick(req.body, 'description', 'completed'); // use _.pick to only description and completed.

	db.todo.create(body).then(function(todo) {
		//res.json(todo.toJSON());
		req.user.addTodo(todo).then(function(){
			return todo.reload();
		}).then(function (todo){
			res.json(todo.toJSON());
		});
	}, function(e) {
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
app.delete('/todos/:id', middleware.requireAuthentication, function(req, res) {

	var todoId = parseInt(req.params.id, 10);
    //
	db.todo.destroy({
		where: {
			id: todoId,
			userId: req.user.get('id')
		}
	}).then(function(rowsDeleted) {
		if (rowsDeleted === 0) {
			res.status(404).json({
				error: 'No todo with id'
			});
		} else {
			res.status(204).send();
		}
	}, function() {
		res.status(500).send();
	});

	// var matchedEle = _.findWhere(todos, {
	// 	id: todoId
	// });

	// if (!matchedEle) {
	// 	res.status(404).json({
	// 		"error": "no todo found ! "
	// 	});
	// } else {
	// 	todos = _.without(todos, matchedEle);
	// 	res.json(matchedEle);
	// }
});

//PUT /todos/:id
app.put('/todos/:id', middleware.requireAuthentication, function(req, res) {
	var todoId = parseInt(req.params.id, 10);
	var body = _.pick(req.body, 'description', 'completed');
	var attributes = {};
	// var matchedEle = _.findWhere(todos, {
	// 	id: todoId
	// });


	// if (!matchedEle) {
	// 	return res.status(404).send();
	// }


	if (body.hasOwnProperty('completed')) {
		attributes.completed = body.completed;
	} // } else if (body.hasOwnProperty('completed')) {
	// 	return res.status(400).send();
	// }

	if (body.hasOwnProperty('description')) {
		attributes.description = body.description;
	} // } else if (body.hasOwnProperty('description')) {
	// 	return res.status(400).send();
	// }
	db.todo.findOne({
		where : {
			id : todoId,
			userId : req.user.get('id')
		}
	}).then(function(todo) {
		if (todo) {
			return todo.update(attributes).then(function(todo) {
				res.json(todo.toJSON());
			}, function(e) {
				res.status(400).json(e);
			});
		} else {
			res.status(404).send();
		}
	}, function() {
		res.status(500).send();
	});
	//HERE
	// _.extend(matchedEle, validAttribute);
	// res.json(matchedEle)

});

app.post('/users', function(req, res){
	var body = _.pick(req.body, 'email', 'password');
    //res.json(body);
	db.user.create(body).then(function(user){
		res.json(user.toPublicJSON());
	}, function(e){
		res.status(400).json(e);
	});
});

//POST /users/login

app.post('/users/login', function(req, res){
	var body = _.pick(req.body, 'email', 'password');

	db.user.authenticate(body).then(function(user){
		var token = user.generateToken('authentication');

		if(token){
			res.header('Auth', token).json(user.toPublicJSON());	
		} else {
			res.status(401).send();	
		}
		
	}, function(){
		res.status(401).send();
	});
	// var where = {};

	

    

});

db.sequelize.sync({force: true}).then(function() {
	app.listen(PORT, function() {
		console.log('Express listening on port ' + PORT + '!');
	});
});