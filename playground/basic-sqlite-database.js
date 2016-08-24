var Sequelize = require('sequelize');
var sequelize = new Sequelize(undefined, undefined, undefined, {
	'dialect' : 'sqlite',
	'storage' : __dirname + '/basic-sqlite-database.sqlite'
});

var Todo = sequelize.define('todo', {
	description: {
		type : Sequelize.STRING,
		allowNull : false,
		validate : {
			len: [1, 250]
		}
	},
	completed: {
		type : Sequelize.BOOLEAN,
		allowNull : false,
		defaultValue : false
	}
});

var User = sequelize.define('user', {
	email : Sequelize.STRING
});

Todo.belongsTo(User);
User.hasMany(Todo);

sequelize.sync(
	 //{force:true}
	).then(function(){
	console.log('Everything is synced');



	// User.findAll({
	// 	where : {
	// 		completed: false
	// 	}

	// }).then(function (user){
	// 	user.getTodos().then(function(todos){
	// 		todos.forEach(function(todo){
	// 			console.log(todo.toJSON());
	// 		});
	// 	});
	// });
	User.findById(1).then(function(user){
		user.getTodos({
			where : {
				completed : false
			}
		}).then(function(todos){
			todos.forEach(function(todo){
				//console.log(todo.toJSON());
				
					console.log(todo);
				
			});
		});
	});
    
    // User.create({
    // 	email: 'andrew@example.com'
    // }).then(function() {
    // 	return Todo.create({
    // 		description: 'Clean yard'
    // 	});
    // }).then(function(todo) {
    // 	User.findById(1).then(function(user){
    // 		user.addTodo(todo);
    // 	});
    // });
});