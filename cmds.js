// import { count } from './model';

const model  = require('./model');
const {log, biglog, errorlog, colorize} = require("./out");

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

	model.getAll().forEach((quiz, id) => {
		
		log(`[${colorize(id, 'magenta')}]: ${quiz.question}`);
	});
	rl.prompt();
};


/** 
 * Muestra el quiz indicado en el parámetro: la pregunta y la respuesta.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a mostrar.
 */
exports.showCmd = (rl, id) => {

	if (typeof id === "undefined") {
		errorlog(`El valor del parámetro id no es válido.`);
	} else {
		try {
			const quiz = model.getByIndex(id);
			log(` [${colorize(id, 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer} `);
		} catch (error) {
			errorlog(error.message);
		}
	}

	rl.prompt();

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

	rl.question(colorize(' Introduzca una pregunta: ', 'red'), question => {
		
		rl.question(colorize(' Introduzca la respuesta: ', 'red'), answer => {
			
			model.add(question, answer);
			log(` ${colorize('Se ha añadido', 'magenta')}: ${question} ${colorize('=>', 'magenta')} ${answer}`);
			rl.prompt();
		});
	});
};


/** 
 * Borra un quiz del modelo.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a borrar del modelo.
 */
exports.deleteCmd = (rl, id) => {

	if (typeof id === "undefined") {
		errorlog(`Falta el parámetro id.`);
	} else {
		try {
			model.deleteByIndex(id);
		} catch(error) {
			errorlog(error.message);
		}
	}

	rl.prompt();
};


/** 
 * Edita un quiz del modelo.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a editar del modelo.
 */
exports.editCmd = (rl, id) => {

	if (typeof id === "undefined") {
		errorlog(`Falta el parámetro id.`);
		rl.prompt();
	} else {
		try {
			
			const quiz = model.getByIndex(id);
			
			process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)}, 0);
			
			rl.question(colorize(' Introduzca una pregunta: ', 'red'), question => {
		
				process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)}, 0);
		
				rl.question(colorize(' Introduzca una respuesta: ', 'red'), answer => {
					
					model.update(id, question, answer);
					log(` Se ha cambiado el quiz ${colorize(id, 'magenta')} por: ${question} ${colorize('=>', 'magenta')} ${answer}`);
					rl.prompt();
				});
			}); 
		} catch (error) {
			errorlog(error.message);
			rl.prompt();
		}
	}
};


/** 
 * Prueba un quiz, es decir, hace na pregunta del modelo a la que debemos contestar.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a probar.
 */
exports.testCmd = (rl, id) => {

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


/**
 * Pregunta todos los quizzes existentes en el modelo en orden aleatorio.
 * Se gana si se contesta a todos satisfactoriamente.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.playCmd = rl => {

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

			}

		let score = 0;
		let toBeResolved = [];
				
		model.getAll().forEach((quiz, id) => {
			toBeResolved.push(quiz);
		});

		playOne();

};


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



