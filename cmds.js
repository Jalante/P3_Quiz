// import { count } from './model';

const {models}  = require('./model');
const {log, biglog, errorlog, colorize} = require("./out");
const Sequelize = require('sequelize');

/** 
 * Muestra la ayuda.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.helpCmd = rl => {
		
		log("Comandos:");
		log("	h|help - Muestra esta ayuda.");
		log("	list - Litar los quizzes existentes.");
		log("	show <id> - Muestra la pregunta y la respuesta del quiz indicado");
		log("	add - Añadir un nuevo quiz interactivamente");
		log("	delete <id> - Borrar el quiz indicado");
		log("	edit <id> - Editar el quiz indicado");
		log("	test <id> - Probar el quiz indicado");
		log("	p|play - Jugar a preguntar aleatoriamente todos los quizzes.");
		log("	credits - Créditos.");
		log("	q|quit - Salir del programa.");	
		rl.prompt();
};


/** 
 * Lista todos los quizzes existentes en el modelo.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.listCmd = rl => {

	models.quiz.findAll()
	.each(quiz => {
		log(` [${colorize(quiz.id, 'magenta')}]: ${quiz.question}`);
	})
	
	/** .then(quizzes => {
		quizzes.forEach(quiz => {
			log(` [${colorize(quiz.id, 'magenta')}]: ${quiz.question}`);
		});
	}) */

	.catch(error => {
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	});
};


/** 
 * Esta función devuelve una promesa que:
 *		- Valida que se ha introducido un valor para el parámetro.
 * 		- Convierte el parámetro en un número entero.
 * Si todo va bien, la promesa se satisface y devuelve el valor del id a usar.
 * 
 * @param id Parámetro con el índice a validar.
 */
const validateId = id => {

	return new Sequelize.Promise((resolve, reject) => {
		if (typeof id === "undefined") {
			reject(new Error(`Falta el parámetro <id>.`));
		} else {
			id = parseInt(id);		// Coge la parte entera y descarta lo demás.
			if (Number.isNaN(id)) {
				reject(new Error(`El valor del parámetro <id> no es un número.`));
			} else {
				resolve(id);
			}
		}
	});
};


/** 
 * Muestra el quiz indicado en el parámetro: la pregunta y la respuesta.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a mostrar.
 */
exports.showCmd = (rl, id) => {

	validateId(id)
	.then(id => models.quiz.findById(id))
	.then(quiz => {
		if (!quiz) {
			throw new Error(`No existe un quiz asociado al id = ${id}.`);
		}
		log(` [${colorize(quiz.id, 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
	})
	.catch(error => {
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	});
};


/** 
 * Esta función convierte la llamada rl.question, que está basada en callbacks, en un función basada en promesas.
 * 
 * Esta función devuelve una promesa que cuando se cumple, proporciona el texto introducido.
 * 
 * También colorea en rojo el texto de la pregunta, elimina espacios al principio y al final.
 * 
 * @param rl Objeto readline usado para implementar el CLI.
 * @param text Pregunta qué hay que hacerle al usuario.
 */
const makeQuestion = (rl, text) => {

	return new Sequelize.Promise((resolve, reject) => {
		rl.question(colorize(text, 'red'), answer => {
			resolve(answer.trim());
		});
	});
};


/** 
 * Añade un nuevo quiz al modelo.
 * Pregunta interactivamente por la pregunta y la respuesta.
 *
 * Hay que recordar que el funcionamiento de la función rl.question es asíncrono.
 * El prompt hay que sacarlo cuando  se ha terminado la interacción con el usuario,
 * es decir, la llamada a rl.prompt() se debe hacer en la callback de la segunda
 * llamada a rl.question.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.addCmd = rl => {

	makeQuestion(rl, 'Introduzca una pregunta: ')
	.then(q => {
		return makeQuestion(rl, 'Introduzca la respuesta: ')
		.then(a => {
			return {question: q, answer: a};
		});
	})
	.then(quiz => {
		return models.quiz.create(quiz);
	})
	.then((quiz) => {
		log(` ${colorize('Se ha añadido', 'magenta')}: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer} `);
	})
	.catch(Sequelize.ValidationError, error => {
		errorlog('El quiz es erróneo: ');
		error.errors.forEach(({message}) => errorlog(message));
	})
	.catch(error => {
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	});
};


/** 
 * Borra un quiz del modelo.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a borrar del modelo.
 */
exports.deleteCmd = (rl, id) => {

	validateId(id)
	.then(id => models.quiz.destroy({where: {id}}))
	.catch(error => {
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	});
};


/** 
 * Edita un quiz del modelo.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a editar del modelo.
 */
exports.editCmd = (rl, id) => {

	validateId(id)
	.then(id => models.quiz.findById(id))
	.then(quiz => {
		if(!quiz) {
			throw new Error(`No existe un quiz asociado al id = {id}.`);
		}

		process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)}, 0);
		return makeQuestion(rl, 'Introduzca la pregunta: ')
		.then(q => {
			process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)}, 0);
			return makeQuestion(rl, 'Introduzca la respuesta: ')
			.then(a => {
				quiz.question = q;
				quiz.answer = a;
				return quiz;
			});
		});
	})
	.then(quiz => {
		return quiz.save();
	})
	.then(quiz => {
		log(` Se ha cambiado el quiz ${colorize(quiz.id, 'magenta')} por:${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer} `);

	})
	.catch(Sequelize.ValidationError, error => {
		errorlog('El quiz es erróneo: ');
		error.errors.forEach(({message}) => errorlog(message));
	})
	.catch(error => {
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	});
};


/** 
 * Prueba un quiz, es decir, hace na pregunta del modelo a la que debemos contestar.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a probar.
 * 
 * 
 * Validar si el id es correcto
 * Acceder a la BD para obtener la pregunta = edit
 * Preguntar por la pregunta asociada al quiz y comprobar si está bien o mal 
 *
 */
/**exports.testCmd = (rl, id) => {

	if (typeof id === "undefined") {
		errorlog(`Falta el parámetro id.`);
		rl.prompt();
	} else {
		try {
			
			const quiz = model.getByIndex(id);
						
			rl.question("¿" + quiz.question + "? " , resp => {																														
				respCase = resp.toLowerCase().trim();
				quizAnswerCase =  quiz.answer.toLowerCase().trim();
					if (respCase == quizAnswerCase) {
						log(`Su respuesta es correcta. `);
						biglog('CORRECTA', 'green');
						
					} else {
						log(`Su respuesta es incorrecta. `);
						biglog('INCORRECTA', 'red');
					} 
					
					rl.prompt();
			});
		 } catch (error) {
			errorlog(error.message);
			rl.prompt();
		}
	}
};
/*

/**
 * Pregunta todos los quizzes existentes en el modelo en orden aleatorio.
 * Se gana si se contesta a todos satisfactoriamente.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * 
 * Cargar en un array todas las preguntas al principio e ir eliminándolas según se van preguntando.
 * 
 */
 
 /** exports.playCmd = rl => {

		const playOne = () => {
			
			if (toBeResolved.length == 0) {
				log(`No hay nada más que preguntar. `);
				log(`Fin del juego. Aciertos: ${score} `);
				biglog(score, 'magenta');
				rl.prompt();
			} else {
			
				let id = Math.floor(Math.random() * toBeResolved.length);
				//const quiz = model.getByIndex(id);
				const quiz = toBeResolved[id];
			
				rl.question("¿" + quiz.question + "? " , (answer) => {	

					respCase = answer.toLowerCase().trim();
					quizAnswerCase =  quiz.answer.toLowerCase().trim();

						if (respCase == quizAnswerCase) {
							score += 1;
							log(` CORRECTO - Lleva ${score} aciertos. `);
							toBeResolved.splice(id,1);
							playOne();
							
						} else {
							log(` INCORRECTO. `);
							log(` Fin del juego. Aciertos: ${score} `);
							biglog(score, 'magenta');
							rl.prompt();
						};
				});																														

			};

			};

		let score = 0;
		let toBeResolved = [];
				
		model.getAll().forEach((quiz, id) => {
			toBeResolved.push(quiz);
		});

		playOne();

};
/*


/** 
 * Muestra el nombre del autor de la práctica.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.creditsCmd = rl => {

	log('Autor de la práctica:');
	log('Javier Labajo Antequera' , 'green')
	rl.prompt();
};


/** 
 * Terminar el programa
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.quitCmd = rl => {

	rl.close();
};



