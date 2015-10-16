var fs = require('fs');
var unirest = require('unirest');
var Bot = require('node-telegram-bot');
var ports = require('./ports');

// Telegram Bot HTTP EndPoint
var BASE_URL = "https://api.telegram.org/bot<token>/METHOD_NAME";
// Token for PortsBot
var TOKEN = ""; // insert here the token of your bot
// Name of the bot
var BOT_NAME = "portsbot"; // in lowercase

// global variables (yes, I know they are bad...)
var vicepresidents_messages_counter = 0;


console.log("PORTS_BOT - starting...");
// Bot Start
var bot = new Bot({
    token: TOKEN,
    poll: true,
    polling: true
})
.on('message', function (message) {
    // new messages handling
    if (message != undefined && message.text != undefined  && message.from.first_name != undefined) {
        console.log("+ New msg: '" + message.text + "' from " + message.from.first_name);
        processMessage(message);
    }
})
.start();

/*
function called when a new message is incoming
*/
function processMessage (message) {

    // all available commands
    var COMMANDS = {
        "start" : start,
        "help" :  help,
        "lista_aule" : lista_aule,
        "top10disponibili" : lista_aule,
        "mappa" : mappa,
        "11" : mappa,
        "12" : mappa,
        "21" : mappa,
        "22" : mappa
    };

    var text = message.text.toLowerCase();

    // check if message contain a room
    if (checkRoom (message, text)) {
        return true;
    }

    // check if msg is a command
    if (text.indexOf('/') !== 0) {
        console.log("> Not a command");
        return false;
    }

    // get command and arguments (opt.)
    var command = null;
    var arg = null;

    if (text.indexOf(' ') === -1) {
        // get string
        command = text.substring(1, text.length);
        // check @ char in groups
        if (command.indexOf('@') != -1) {
            // get the name of the bot
            var botName = command.substring(command.indexOf('@') + 1, command.length);
            console.log(botName);
            if (botName != BOT_NAME) {
                // command not for PortsBot
                console.log("> Command not for me");
                return false;
            } else {
                // get the real command deleting the bot's name (command@bot -> command)
                command = command.substring(0, command.indexOf('@'));
            }
        }
    }
    else {
        command = text.substring(1, text.indexOf(' '));
        arg = text.substring(text.indexOf(' '), text.length);

        // check @ char in groups
        if (command.indexOf('@') != -1) {
            // get the name of the bot
            var botName = command.substring(command.indexOf('@') + 1, text.indexOf(' '));

            if (botName != BOT_NAME) {
                // command not for PortsBot
                console.log("> Command not for me");
                return false;
            } else {
                // get the real command deleting the bot's name (command@bot -> command)
                command = command.substring(0, command.indexOf('@'));
            }
        }
    }

    // check if command is valid
    if (COMMANDS[command] == null) {
        console.log("> Not a valid command");
        return false;
    }

    // 'easter egg'
    if (message.from.username == "povopresident") {
        bot.sendMessage({
            chat_id: message.chat.id,
            text: "PovoPresident! 😮 \nLe recupero subito le informazioni che desidera..."
        }, function (err ,msg) {
            if (!err) {
                console.log("> Sent pres greetins infos.");
            } else {
                console.log("! Sent pres greetings error: " + err);
            }

            // execute command function
            executeCmd (message, command, arg);

        });
    }
    else if (message.from.username == "povovicepresident") {

        // asking too frequently
        if (vicepresidents_messages_counter >= 3) {

            bot.sendMessage({
                chat_id: message.chat.id,
                text: "PovoVicePresident 😠 non ti sembra di fare un pò troppe richieste?"
            }, function (err ,msg) {
                if (!err) {
                    console.log("> Sent vicepres too much infos.");
                } else {
                    console.log("! Sent vicepres too much error: " + err);
                }
            });

        } else { // ok, answer
            vicepresidents_messages_counter++;
            // reduce the counter after some time
            setTimeout(function () {
                vicepresidents_messages_counter--;
                if (vicepresidents_messages_counter < 0) { // should never happen
                    vicepresidents_messages_counter = 0;
                }
                console.log("VicePresident counter reduced: " + vicepresidents_messages_counter);
            }, 60000);
            bot.sendMessage({
                chat_id: message.chat.id,
                text: "PovoVicePresident 😒 per questa volta ti rispondo..."
            }, function (err ,msg) {
                if (!err) {
                    console.log("> Sent vicepres greetins infos.");
                } else {
                    console.log("! Sent vicepres greetings error: " + err);
                }
                // execute command function
                executeCmd (message, command, arg);
            });
        }
    }
    else if (message.from.first_name == "Williams" && message.from.last_name == "Rizzi") {
        bot.sendMessage({
            chat_id: message.chat.id,
            text: "Willy...a te non rispondo...."
        }, function (err ,msg) {
            if (!err) {
                console.log("> Sent willy greetins infos.");
            } else {
                console.log("! Sent willy greetings error: " + err);
            }
        });
    }
    else {
        // execute command function
        executeCmd (message, command, arg);
    }
}

function executeCmd (message, command, arg) {
    // execute command function
    switch (command) {
        case "start":
        start(message);
        break;
        case "help":
        help(message);
        break;
        case "lista_aule":
        lista_aule(message, 9999);
        break;
        case "top10disponibili":
        lista_aule(message, 10);
        break;
        case "mappa":
        mappa(message, arg);
        break;
        case "11":
        mappa(message, 11);
        break;
        case "12":
        mappa(message, 12);
        break;
        case "21":
        mappa(message, 21);
        break;
        case "22":
        mappa(message, 22);
        break;
        default:
        return false;
    }
    return true;
}



/*
Commands functions
*/

// Sent help message
var help = function(message) {

    var text = "PORTS - Povo Offer Rooms To Study\n\n" +
    "Comandi:\n" +
    "/lista_aule - mostra la lista delle aule di Povo con il relativo stato\n" +
    "/top10disponibili - mostra le 10 aule libere per più tempo da adesso\n" +
    "/mappa - mostra lo stato delle aule sulla mappa. Il comando deve essere seguito " +
    "dalla coppia 'Polo-Piano' di cui si vogliono avere info (es: /mappa 11)\n" +
    " Legenda: \n" +
    " 11: Polo 1, Piano 1\n" +
    " 12: Polo 1, Piano 2\n" +
    " 21: Polo 2, Piano 1\n" +
    " 22: Polo 2, Piano 2\n" +
    "/11, /12, /21, /22 - scorciatoie per il comando mappa\n";

    bot.sendMessage({
        chat_id: message.chat.id,
        text: text
    }, function (err ,msg) {
        if (!err) {
            console.log("> Sent help infos.");
        } else {
            console.log("! Sent help info error: " + err);
        }
    });
};

// Sent start messsage
var start = function(message) {

    var text = "PORTS - Povo Offer Rooms To Study\n\n" +
    "Controlla la disponibilità delle aule di Povo con Ports!\n" +
    "Per maggiori info usa il comando /help";

    bot.sendMessage({
        chat_id: message.chat.id,
        text: text
    }, function (err ,msg) {
        if (!err) {
            console.log("> Sent start msg.");
        } else {
            console.log("! Sent start msg error: " + err);
        }
    });
};


// Sent the status of every room
var lista_aule = function(message, arg) {

    // check if limit is valid
    var limit = parseInt(arg);

    if (isNaN(limit)) {
        console.log("! Rooms list error: limit argument is NaN");
        bot.sendMessage({
            chat_id: message.chat.id,
            text: "Ops..qualcosa è andato storto..."
        }, function (err ,msg) {
            if (!err) {
                console.log("> Sent rooms list NaN error msg.");
            } else {
                console.log("! Sent rooms list NaN error: " + err);
            }
        });
        return false;
    }

    // get infos from Ports
    ports.getPortsData()
    .then(function (data) {

        data.sort(function(a, b) {
            return b.availability - a.availability;
        });

        // create text for response message
        var text = "";
        if (limit == 9999) {
            text = "STATO AULE\n\n";
        } else {
            text = "TOP 10 AULE LIBERE ADESSO\n\n";
        }

        // populate the message
        for (var i=0; (i < limit) && (i < data.length); i++) {

            switch (data[i].class) {
                case "dark-green":
                text = text + "📗 " + data[i].number + ": Sempre libera...vai tranquillo";
                break;
                case "green":
                text = text + "📗 " + data[i].number + ": Libera per " + data[i].availability + " ore";
                break;
                case "yellow":
                text = text + "📒 " + data[i].number + ": Libera per " + data[i].availability + " ore";
                break;
                case "orange":
                text = text + "📙 " + data[i].number + ": Affrettati, sarà libera solo per " + data[i].availability + " ore";
                break;
                case "red":
                text = text + "📕 " + data[i].number + ": Occupata";
                break;
                default:
                text = text + "📘 " + data[i].number + ": Boh...";
                break;
            }
            text = text + "\n";
        }

        // send the message
        bot.sendMessage({
            chat_id: message.chat.id,
            text: text
        }, function (err ,msg) {
            if (!err) {
                console.log("> Sent rooms list.");
            } else {
                console.log("! Sent rooms list error: " + err);
            }
        });


        // no data from Ports handling
    }, function (error) {
        sendGenericError(message);
        return false;
    });
};

// Send the map image of a floor
var mappa = function (message, arg) {

    // Building-Floor combinations
    var FLOORS = [11, 12, 21, 22];

    // check if floor is valid
    var floor = parseInt(arg);

    // check if floor exists
    var exist = false;
    for (var i in FLOORS) {
        if (FLOORS[i] == floor) {
            exist = true;
        }
    }

    // ask for the right floor
    if (!exist || isNaN(floor)) {
        bot.sendMessage({
            chat_id: message.chat.id,
            text: "Scegli anche il Polo e il Piano... (es: /mappa 12).\n /help per maggiori info."
        }, function (err ,msg) {
            if (!err) {
                console.log("> Sent rooms list floor error msg.");
            } else {
                console.log("! Sent rooms list floor error: " + err);
            }
        });
        return false;
    }

    // retrieve data from ports and send the floor image
    ports.getPortsData()
    .then(function (data) {
        console.log("> Got Ports data.");

        bot.sendMessage({
            chat_id: message.chat.id,
            text: "Ok, aspetta un attimo che disegno la mappa..."
        }, function (err ,msg) {
            if (!err) {
                console.log("> Sent wait map msg.");
            } else {
                console.log("! Sent map wait error: " + err);
            }
        });


        // create the image
        ports.createBuildingImg(data, floor)
        .then(function (img) {

            console.log("> Sending the image: " + img.url);
            // send the image
            bot.sendPhoto({
                chat_id: message.chat.id,
                caption: img.caption,
                files: {
                    photo: img.url
                }
            }, function (err, msg) {
                if (!err) {
                    console.log("> Sent '" + floor + "' image.");
                } else {
                    console.log("! Sending " + floor + " image error: "  + err);
                }

                // delete the tmp svg and png
                fs.unlink(img.url);
                var svg = img.url.replace("png", "svg");
                fs.unlink(svg);
            });

            // image not created handling
        }, function(error) {
            console.log("! Image not created: " + error);
            sendGenericError(message);
            return false;
        });

        // no data from Ports handling
    }, function (error) {
        sendGenericError(message);
        return false;
    });
};

// send a generic error message
function sendGenericError (message) {

    var text = "Ora non ho tempo per controllare... prova a bussare ad ogni porta...";

    // send the message
    bot.sendMessage({
        chat_id: message.chat.id,
        text: text
    }, function (err ,msg) {
        if (!err) {
            console.log("> Sent no data from Ports msg.");
        } else {
            console.log("! Sent no data from Ports error: " + err);
        }
    });
}

// check if the message contain a room
function checkRoom (message, text) {
    var ROOMS = [
        "a101",
        "a102",
        "a103",
        "a104",
        "a105",
        "a106",
        "a107",
        "a108",
        "a201",
        "a202",
        "a203",
        "a204",
        "a205",
        "a206",
        "a207",
        "a208",
        "a209",
        "a210",
        "a211",
        "a212",
        "a213",
        "a214",
        "a215",
        "a216",
        "a217",
        "a218",
        "a219",
        "a220",
        "a221",
        "a222",
        "a223",
        "a224",
        "b101",
        "b102",
        "b103",
        "b104",
        "b105",
        "b106",
        "b107"
    ];

    var result = false;

    var rooms_found = [];

    for (var i in ROOMS) {
        if (text.indexOf(ROOMS[i]) != -1) {
            console.log("> Find a room in a msg. (" + ROOMS[i] + ")");
            rooms_found.push(ROOMS[i]);
            result = true;
        }
    }

    if (result) {
        if (rooms_found.length <= 3) {
            for (var j in rooms_found) {
                ports.getRoomImg(rooms_found[j])
                .then(function(img) {

                    bot.sendPhoto({
                        chat_id: message.chat.id,
                        caption: "Qualcuno ha detto " + img.room.toUpperCase() + "?",
                        files: {
                            photo: img.url
                        }
                    }, function (err) {
                        if (!err) {
                            console.log("> Sent room image.");
                        } else {
                            console.log("! Sending room image error: "  + err);
                        }

                        // delete the tmp svg and png
                        fs.unlink(img.url);
                        var svg = img.url.replace("png", "svg");
                        fs.unlink(svg);
                    });

                    // image creation failed
                }, function(err) {
                    console.log("! Image of a room not created: " + error);
                    sendGenericError(message);
                    return false;
                });
            }
        } else {
            console.log("More than 3 rooms in a message.");
            bot.sendMessage({
                chat_id: message.chat.id,
                text: "Troppe aule... non sto qui a mostrartele tutte..."
            }, function (err ,msg) {
                if (!err) {
                    console.log("> Sent 'too much' room image.");
                } else {
                    console.log("! Sent 'too much' room image error: " + err);
                }
            });
        }
    }
    return result;
}
