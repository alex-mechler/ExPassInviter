require('dotenv').config();

const bm = require('bipartite-matching');
const discord = require('discord.js');
const db = require('./db.js');
const client = new discord.Client();

client.on('ready', () => {
  console.log('EX Pass Inviter bot started');
});

// Create an event listener for messages
client.on('message', message => {
	if(message.channel.name !== process.env.MONITOR_CHANNEL) return;
	if(message.content[0] !== '&') return;
	message.delete();
  
  command = message.content.split(' ');
  switch(command[0].toLowerCase()){
  	case '&addaccount':
  		accountDoesNotExist(message, command, addAccount);
  		break;
  	case '&deleteaccount':
  	  isAccountOwner(message, command, deleteAccount);
  		break;
  	case '&addfriend':
  	  isAccountOwner(message, command, addFriend);
  		break;
  	case '&deletefriend':
  		isAccountOwner(message, command, deleteFriend);
  		break;
  	case '&haspass':
  		isAccountOwner(message, command, hasPass);
  		break;
  	case '&needspass':
  		isAccountOwner(message, command, needsPass);
  		break;
  	case '&getstatus':
  		isAccountOwner(message, command, getStatus);
  		break;
  	case '&distributepasses':
  		isAdmin(message, command, distributePasses);
  		break;
  	case '&clearpasses':
  		isAdmin(message, command, clearPasses);
  		break;
  	case '&help':
  		printHelp(message);
  		break;
  }
});

client.login(process.env.CLIENT_TOKEN);

function printHelp(message){
	message.author.send('Avaliable Commands: \n `&addaccount accountname` \n `&deleteaccount accountname` \n `&addfriend yourAccount friendAccount` \n `&deletefriend yourAccount friendAccount` \n `&haspass account true/false` \n `&needspass account true/false` \n `&getstatus account`');
}

const isAdmin = function(message, command, next){
	if(message.author.id === process.env.ADMIN) next(message, command);
}

const isAccountOwner = function(message, command, next){
	db.query('SELECT id FROM account WHERE owner=$1 AND name=$2', [message.author.id, command[1]]).then(res => {
		if(res.rows.length > 0){
			next(message, command);
		} else {
			sendReply(message, 'You do not own the account ' + command[1]);
		}
	}).catch(errorMessage);
}

const accountDoesNotExist = function(message, command, next){
	db.query('SELECT id FROM account WHERE name=$1', [command[1]]).then(res => {
		if(res.rows.length === 0){
 			next(message, command);
		} else {
			sendReply(message, 'That account already exists!');
		}
	}).catch(errorMessage);
}

const addAccount = function(message, command){
	if(command.length < 2){
		sendReply(message, 'Usage `&addaccount accountname`');
		return;
	}
	db.query('INSERT INTO account (name, owner) VALUES ($1, $2)', [command[1], message.author.id]).then(res => {sendReply(message, 'Added the account ' + command[1] + ' to the database!')}).catch(errorMessage);
}

const deleteAccount = function(message, command){
	if(command.length < 2){
		sendReply(message, 'Usage `&deleteaccount accountname`');
		return
	}
	db.query('DELETE FROM account WHERE name=$1', [command[1]]).then(res => {sendReply(message, 'Deleted the account ' + command[1])}).catch(errorMessage);
}

const addFriend = function(message, command){
	if(command.length < 3){
		sendReply(message, 'Usage `&addfriend yourAccount friendAccount`');
		return;
	}
	if(command[1] === command[2]){
		sendReply(message, 'You cannot friend yourself!');
		return;
	}
	db.query('SELECT id FROM account WHERE name=$1 OR name=$2', [command[1], command[2]]).then(res => {
		rows = res.rows;
		if(rows.length != 2){
			sendReply(message, 'Invalid account names!');
			return;
		}
		first = Number(rows[0]['id']);
		second = Number(rows[1]['id']);
		db.query('SELECT * FROM friendship WHERE (first=$1 OR first=$2) AND (second=$1 OR second=$2)', [first, second]).then(res => {
			if(res.rows.length > 0){
				sendReply(message, 'You are already friends!');
				return;
			}
			db.query('INSERT INTO friendship (first, second) VALUES ($1, $2)', [first, second]).then(res =>{
				sendReply(message, 'Friended ' + command[1] + ' and ' + command[2]);
			}).catch(errorMessage);
		}).catch(errorMessage);
	}).catch(errorMessage);
}

const deleteFriend = function(message, command){
	if(command.length < 3){
		sendReply(message, 'Usage `&deletefriend yourAccount friendAccount`');
		return;
	}
	db.query('SELECT id FROM account WHERE name=$1 OR name=$2', [command[1], command[2]]).then(res => {
		rows = res.rows;
		if(rows.length != 2){
			sendReply(message, 'Invalid account names!');
			return;
		}
		first = Number(rows[0]['id']);
		second = Number(rows[1]['id']);
		db.query('DELETE FROM friendship WHERE (first=$1 OR first=$2) AND (second=$1 OR second=$2)', [first, second]).then(res => {
			sendReply(message, 'Deleted the friendship');
		});
	}).catch(errorMessage);
}

const hasPass = function(message, command){
	if(command.length < 3 || (command[2].toLowerCase() != 'true' && command[2].toLowerCase() != 'false')){
		sendReply(message, 'Usage `&haspass account true/false`');
		return;
	}
	db.query('UPDATE account SET has=$1 WHERE name=$2', [command[2].toLowerCase(), command[1]]).then(res => {
		sendReply(message, 'Set HasPass to ' + command[2] + ' for account ' + command[1]);
	}).catch(errorMessage);
}

const needsPass = function(message, command){
	if(command.length < 3 || (command[2].toLowerCase() != 'true' && command[2].toLowerCase() != 'false')){
		sendReply(message, 'Usage `&needspass account true/false`');
		return;
	}
	db.query('UPDATE account SET needs=$1 WHERE name=$2', [command[2].toLowerCase(), command[1]]).then(res => {
		sendReply(message, 'Set NeedsPass to ' + command[2] + ' for account ' + command[1]);
	}).catch(errorMessage);
}

const getStatus = function(message, command){
	if(command.length < 2){
		sendReply(message, 'Usage `&getstatus account`');
		return;
	}
	db.query('SELECT name, needs, has FROM account WHERE name=$1', [command[1]]).then(res => {
		rows = res['rows'];
		sendReply(message, rows[0]['name'] + ' HasPass:' + rows[0]['has'] + ' NeedsPass:' + rows[0]['needs']);
	}).catch(errorMessage);
}

const distributePasses = function(message, command){
	sendReply(message, 'Calculating passes');
	db.query('SELECT id FROM account WHERE has=true').then(res => {
		hasRows = res['rows'];
		if(hasRows.length == 0){
			sendReply(message, 'Noone has any passes!');
			return;
		}
		has = [];
		hasRows.forEach(elm => {
			has.push(elm['id']);
		});
		db.query('SELECT id FROM account WHERE needs=true').then(res => {
			needsRows = res['rows'];
			if(needsRows.length == 0){
				sendReply(message, 'Noone needs any passes!');
				return;
			}
			needs = [];
			needsRows.forEach(elm => {
				needs.push(elm['id'])
			});
			db.query('SELECT first, second FROM friendship').then(res => {
				friendsRows = res['rows'];
				if(friendsRows.length == 0){
					sendReply(message, 'Noone has any friends!');
					return;
				}
				friends = [];
				friendsRows.forEach(elm => {
					friends.push([elm['first'], elm['second']]);
					friends.push([elm['second'], elm['first']]);
				});
				friends = friends.filter(elm => {
					return has.includes(elm[0]) && needs.includes(elm[1]);
				});
				db.query('SELECT id FROM account ORDER BY id DESC LIMIT 1').then(res => {
					size = res['rows'][0]['id'] + 1;
					result = bm(size, size, friends);
					accountMap = {};
					db.query('SELECT id, name, owner FROM account').then(res => {
						rows = res['rows'];
						rows.forEach(elm => {
							accountMap[elm['id']] = {'name': elm['name'], 'owner': elm['owner']};
						});
						sendString = 'Here are the pass invites for the next EX raid! Please send passes to the people below so that as many people as possible can attend! \n ';
						result.forEach(elm => {
							sendString += '<@' + accountMap[elm[0]]['owner'] + '>\'s ' + accountMap[elm[0]]['name'] + ' invites ';
							sendString += '<@' + accountMap[elm[1]]['owner'] + '>\'s ' + accountMap[elm[1]]['name'] + ' \n ';
						});
						message.channel.send(sendString);
					});
				}).catch(errorMessage);
			}).catch(errorMessage);
		}).catch(errorMessage);
	}).catch(errorMessage);
}

const clearPasses = function(message, command){
	db.query('UPDATE account SET has=false, needs=false').then(res => {sendReply(message, 'Cleared all passes');}).catch(errorMessage);
}

const sendReply = function(message, reply){
	message.reply(reply).then(sent => {sent.delete(5000)}).catch(console.error);
}

const errorMessage = function(err){
	console.error(err);
}