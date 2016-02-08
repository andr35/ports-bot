var http = require('http');
var fs = require('fs');
var unirest = require('unirest');
var TelegramBot = require('node-telegram-bot-api');
var ports = require('./ports');

// openshift's environment variables for webhook
var openshift_port = process.env.OPENSHIFT_NODEJS_PORT;
var openshift_host = process.env.OPENSHIFT_NODEJS_IP;
var openshift_domain = process.env.OPENSHIFT_APP_DNS;

// Telegram Bot HTTP EndPoint
var BASE_URL = "https://api.telegram.org/bot<token>/METHOD_NAME";
// Token for PortsBot
var TOKEN = "136374788:AAFSeFAdaHB7WarWxnK0UYeKvcsbQA5KlfM"; // insert here the token of your bot
// Name of the bot
var BOT_NAME = "portsbot"; // in lowercase
// Webhook endpoint
var WEBHOOK = openshift_domain + ':443/bot' + TOKEN;
// Certificates for Webhook connection (CERT_KEY_URI: private key, CERT_URI: public key)
var CERT_KEY_URI = __dirname + '/cert/key.pem';
var CERT_URI = __dirname + '/cert/cert.pem';


// global variables
var vicepresidents_messages_counter = 0;

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


// WebPage
// var webPage = "";
// fs.readFile(__dirname + '/index.html', function (err, data) {
//     webPage = err ? ("PortsBot") : (data);
// });
//
// http.createServer(function (req, res) {
//     res.writeHead(200);
//     res.write(webPage);
//     res.end();
// }).listen(80);
// console.log("i Basic http server listening on port 80.");


if (openshift_host !== undefined && openshift_port !== undefined && openshift_domain !== undefined) {
    console.log("Host: " + openshift_host + "\nPort: " + openshift_port + "\nDomain: " + openshift_domain + "\n");
}
// Bot Start
console.log("i PORTS_BOT - starting...");
var bot = new TelegramBot(TOKEN, {
	webHook: {
		port: openshift_port,
		host: openshift_host,
		key: CERT_KEY_URI,
		cert: CERT_URI
	}});

// Webhook
console.log("> Setting webhook on " + WEBHOOK);
bot.setWebHook(WEBHOOK, CERT_URI)
.then(function (res) {
    console.log("> Webhook set up successfully!");
    console.log("  Response: " + res);
}, function (err) {
    console.log("> Error while set up the Webhook:");
    console.log("  Error: " + err);
    // if webhook fails, use polling system
    console.log("> Setting up polling...");
    /* Polling */
    bot = new TelegramBot(TOKEN,  {
        polling: true
    });
})
.finally(function () {
    console.log("> Ready...");

    // listen for new messages
    bot.on('message', function (message) {
        // new messages handling
        if (message != undefined && message.text != undefined  && message.from.first_name != undefined) {
            console.log("+ New msg: '" + message.text + "' from " + message.from.first_name);
            processMessage(message);
        }
    });

    // listen for inline queries
    bot.on('inline_query', function (inline) {
        // new inline handling
        if (inline != undefined && inline.query != undefined && inline.from.first_name != undefined) {
            console.log("+ New inline query: '" + inline.query + "' from " + inline.from.first_name);
            processInlineQuery(inline);
        }
    });
});



/*
*   InlineQuery
*/
function processInlineQuery(inline) {

    var result = [];
    var query = inline.query.toLowerCase();


    // filter rooms
    if (query == '') {
        for (var i = 0; i < ROOMS.length; i++) {
            result.push({type: 'article', id: (''+i), title: ROOMS[i], message_text: ('Aula ' + ROOMS[i]) });
        }
    } else {
        for (var i = 0; i < ROOMS.length; i++) {
            if (ROOMS[i].indexOf(query) !== -1) {
                result.push({type: 'article', id: (''+i), title: ROOMS[i], message_text: ('Aula ' + ROOMS[i]) });
            }
        }
    }

    // send query
    bot.answerInlineQuery(inline.id, result)
    .then(function (res) {
        console.log("> Sent inline query message.");
    }, function (err) {
        console.log("! Sent inline query error: " + err);
    });
}


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

            bot.sendMessage(message.chat.id, "PovoVicePresident 😠 non ti sembra di fare un pò troppe richieste?")
            .then(function (res) {
                console.log("> Sent vicepres too much infos.");
            }, function (err) {
                console.log("! Sent vicepres too much error: " + err);
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

            bot.sendMessage(message.chat.id, "PovoVicePresident 😒 per questa volta ti rispondo...")
            .then(function (res) {
                console.log("> Sent vicepres greetins infos.");
                // execute command function
                executeCmd (message, command, arg);
            }, function (err) {
                console.log("! Sent vicepres greetings error: " + err);
            })
            .finally(function (res, err) {
                // execute command function
                executeCmd (message, command, arg);
            });
        }
    }
    else if (message.from.first_name == "Williams" && message.from.last_name == "Rizzi") {

        bot.sendMessage(message.chat.id, "Willy...a te non rispondo....")
        .then(function (res) {
            console.log("> Sent willy greetins infos.");
        }, function (err) {
            console.log("! Sent willy greetings error: " + err);
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
    "*/lista_aule* - mostra la lista delle aule di Povo con il relativo stato\n" +
    "/top10disponibili* - mostra le 10 aule libere per più tempo da adesso\n" +
    "/mappa* - mostra lo stato delle aule sulla mappa. Il comando deve essere seguito " +
    "dalla coppia 'Polo-Piano' di cui si vogliono avere info (es: /mappa 11)\n" +
    " _Legenda:_ \n" +
    " *11*: Polo 1, Piano 1\n" +
    " *12*: Polo 1, Piano 2\n" +
    " *21*: Polo 2, Piano 1\n" +
    " *22*: Polo 2, Piano 2\n" +
    "*/11*, */12*, */21*, */22* - scorciatoie per il comando mappa\n";

    bot.sendMessage(message.chat.id, text, {parse_mode: "Markdown"})
    .then(function (res) {
        console.log("> Sent help infos.");
    }, function (err) {
        console.log("! Sent help info error: " + err);
    });
};

// Sent start messsage
var start = function(message) {

    var text = "*PORTS* - Povo Offer Rooms To Study\n\n" +
    "Controlla la disponibilità delle aule di Povo con Ports!\n" +
    "Per maggiori info usa il comando */help*";

    bot.sendMessage(message.chat.id, text, {parse_mode: "Markdown"})
    .then(function (res) {
        console.log("> Sent start msg.");
    }, function (err) {
        console.log("! Sent start msg error: " + err);
    });
};


// Sent the status of every room
var lista_aule = function(message, arg) {

    // check if limit is valid
    var limit = parseInt(arg);

    if (isNaN(limit)) {
        console.log("! Rooms list error: limit argument is NaN");

        bot.sendMessage(message.chat.id, "Ops..qualcosa è andato storto...")
        .then(function (res) {
            console.log("> Sent rooms list NaN error msg.");
        }, function (err) {
            console.log("! Sent rooms list NaN error: " + err);
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
            text = "_STATO AULE_\n\n";
        } else {
            text = "_TOP 10 AULE LIBERE ADESSO_\n\n";
        }

        // populate the message
        for (var i=0; (i < limit) && (i < data.length); i++) {

            switch (data[i].class) {
                case "dark-green":
                text = text + "📗 *" + data[i].number + "*: Libera per tutta la giornata";
                break;
                case "green":
                text = text + "📗 *" + data[i].number + "*: Libera per " + data[i].availability + " ore";
                break;
                case "yellow":
                text = text + "📒 *" + data[i].number + "*: Libera per " + data[i].availability + " ore";
                break;
                case "orange":
                text = text + "📙 *" + data[i].number + "*: Affrettati, sarà libera solo per " + data[i].availability + " ore";
                break;
                case "red":
                text = text + "📕 *" + data[i].number + "*: Occupata";
                break;
                default:
                text = text + "📘 *" + data[i].number + "*: Boh...";
                break;
            }
            text = text + "\n";
        }

        // send the message
        bot.sendMessage(message.chat.id, text, {parse_mode: "Markdown"})
        .then(function (res) {
            console.log("> Sent rooms list.");
        }, function (err) {
            console.log("! Sent rooms list error: " + err);
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

        bot.sendMessage(message.chat.id, "Scegli anche il Polo e il Piano... (es: /mappa 12).\n /help per maggiori info.")
        .then(function (res) {
            console.log("> Sent rooms list floor error msg.");
        }, function (err) {
            console.log("! Sent rooms list floor error: " + err);
        });
        return false;
    }

    // retrieve data from ports and send the floor image
    ports.getPortsData()
    .then(function (data) {
        console.log("> Got Ports data.");

        bot.sendMessage(message.chat.id, "_Ok, aspetta un attimo che disegno la mappa..._", {parse_mode: "Markdown"})
        .then(function (res) {
            console.log("> Sent wait map msg.");
        }, function (err) {
            console.log("! Sent map wait error: " + err);
        });

        // create the image
        ports.createBuildingImg(data, floor)
        .then(function (img) {

            console.log("> Sending the image for floor: " + floor);
            // send the image
            bot.sendPhoto(message.chat.id, img.buffer, {
                caption: img.caption,
            })
            .then(function (res) {
                console.log("> Sent '" + floor + "' image.");
            }, function (err) {
                console.log("! Sending " + floor + " image error: "  + err);
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
    bot.sendMessage(message.chat.id, text)
    .then(function (res) {
        console.log("> Sent no data from Ports msg.");
    }, function (err) {
        console.log("! Sent no data from Ports error: " + err);
    });

}

// check if the message contain a room
function checkRoom (message, text) {

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

                    bot.sendPhoto(message.chat.id, img.buffer, {
                        caption: "Qualcuno ha detto " + img.room.toUpperCase() + "?",
                    })
                    .then(function (res) {
                        console.log("> Sent room image.");
                    }, function (err) {
                        console.log("! Sending room image error: "  + err);
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

            bot.sendMessage(message.chat.id, "Troppe aule... non sto qui a mostrartele tutte...")
            .then(function (res) {
                console.log("> Sent 'too much' room image.");
            }, function (err) {
                console.log("! Sent 'too much' room image error: " + err);
            });
        }
    }
    return result;
}
