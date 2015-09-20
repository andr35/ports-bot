var fs = require('fs');
var unirest = require('unirest');
var Bot = require('node-telegram-bot');
var ports = require('./ports');

// Telegram Bot HTTP EndPoint
var BASE_URL = "https://api.telegram.org/bot<token>/METHOD_NAME";
// Token for PortsBot
var TOKEN = "136374788:AAFSeFAdaHB7WarWxnK0UYeKvcsbQA5KlfM";


console.log("PORTS_BOT - starting...");
// Bot Start
var bot = new Bot({
    token: TOKEN,
    poll: true,
    polling: true
})
.on('message', function (message) {
    // new messages handling
    console.log("+ New msg: " + message.text);
    processMessage(message);
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
        "mappa" : mappa
    };

    var text = message.text.toLowerCase();

    // check if msg is a command
    if (text.indexOf('/') !== 0) {
        console.log("> Not a command");
        return false;
    }

    // get command and arguments (opt.)
    var command = null;
    var arg = null;

    if (text.indexOf(' ') === -1) {
        command = text.substring(1, text.length);
    }
    else {
        command = text.substring(1, text.indexOf(' '));
        arg = text.substring(text.indexOf(' '), text.length);
    }

    // check if command is valid
    if (COMMANDS[command] == null) {
        console.log("> Not a valid command");
        return false;
    }

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
    " Legenda: " +
    " 11: Polo 1, Piano 1\n" +
    " 12: Polo 1, Piano 2\n" +
    " 21: Polo 2, Piano 1\n" +
    " 22: Polo 2, Piano 2\n";

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
        console.log("> Got the data: " + data);

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

            console.log("Sending the image: " + img.url);
            // send the image
            bot.sendPhoto({
                chat_id: message.chat.id,
                caption: img.caption,
                files: {
                    photo: img.url
                }
            }, function (err, msg) {
                if (!err) {
                    console.log("> Sent " + floor + " image.");
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
