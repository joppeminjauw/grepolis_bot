// variables
var Discord = require('discord.js');
var Enum = require('enum');
var mysql = require('mysql');
const { version } = require('os');
const bot = new Discord.Client();
const prefix = '!';
var deffChannel;
var beschikbaarChannel;
var mythenChannel;
var vsChannel;
var alleSpelers = [];
var channels = new Enum(
    {
        'troepenTotaal': "deff",
        'troepenbeschikbaar': "deff-beschikbaar",
        'troepenvs': "vs",
        'troepenmyth': "myth"
    });

// bot functions
bot.login('YOUR_AUTH_TOKEN');

bot.on('ready', () => {
    console.log('online!');
    deffChannel = bot.channels.cache.find(channel => channel.name === channels.getValue('troepenTotaal'));
    beschikbaarChannel = bot.channels.cache.find(channel => channel.name === channels.getValue('troepenbeschikbaar'));
    mythenChannel = bot.channels.cache.find(channel => channel.name === channels.getValue('troepenmyth'));
    vsChannel = bot.channels.cache.find(channel => channel.name === channels.getValue('troepenvs'));
    GetSpelers();
})

bot.on('message', message => {
    let msgPrefix = message.content.substring(0, 1);
    let args = message.content.substring(prefix.length).split(' ');
    let username = message.author.username;
    var speler;

    if (msgPrefix === prefix) {
        try {
            speler = alleSpelers.find(s => s.naam === username)
        } catch (e) {
            console.log("De speler " + username + " zit niet in de database!");
        }
        var cmd = args[0];

        args = args.splice(1);
        switch (cmd) {
            case 'addMe':
                if (!args[0]) {
                    message.channel.send("Geef je grepo naam op met commando !addMe 'greponaam'!");
                } else {
                    console.log("id: " + message.author.id);  
                    if (alleSpelers.find(s => s.id === message.author.id)) {
                        message.channel.send("Je bestaat al!");
                    } else {
                        let spelersnaam = message.content.substring(7);
                        let speler = new Speler(message.author.id, spelersnaam);
                        InsertSpeler(speler);
                        setTimeout(() => {
                            GetSpelers();
                        }, 1000);
                    }
                }
                message.react('✅').then(message.delete({ timeout: 3000 }));
                break;
            // case 'setName':
            //     let naam = message.content.substring(9);
            //     console.log(naam);
            //     if (!args[0]) {
            //         message.delete(3000);
            //         message.reply("Je moet wel een naam opgeven pik!").then(r => r.delete(3000));
            //     } else {
            //         try {
            //             message.react('âœ…').then(message.delete(3000));
            //             let speler = spelers.find(s => s.id === message.author.id);
            //             if (typeof speler !== "undefined") {
            //                 speler.naam = naam;
            //                 WriteSpelersToFile(spelers);
            //             } else {
            //                 message.channel.sendMessage("Je zit nog niet in de database, Geef je grepo naam op met commando !addMe 'greponaam'!");
            //             }
            //         } catch (e) {
            //             message.channel.sendMessage("Geef je grepo naam op met commando !addMe 'greponaam'!");
            //         }
            //     }
            //     break;
            case 'thuis':
                let availableUnits = JSON.parse(message.content.substring(7));
                if (typeof speler === 'undefined') {
                    message.channel.send(`Kon de troepen van ${username} niet updaten! Gebruik !setName 'username' om je naam in te stellen.`);
                } else {
                    if(availableUnits.sword) {
                        speler.zwAv = availableUnits.sword;
                    }else {
                        speler.zwAv = 0;
                    }
                    if(availableUnits.bireme) {
                        speler.birAv = availableUnits.bireme;
                    }else {
                        speler.birAv = 0;
                    }
                    if(availableUnits.archer) {
                        speler.boogAv = availableUnits.archer;
                    }else {
                        speler.boogAv = 0;
                    }
                    if(availableUnits.hoplite) {
                        speler.hopAv = availableUnits.hoplite;
                    }else {
                        speler.hopAv = 0;
                    }
                    if(availableUnits.chariot) {
                        speler.karAv = availableUnits.chariot;
                    }else {
                        speler.karAv = 0;
                    }
                    if(availableUnits.attack_ship) {
                        speler.vsAv = availableUnits.attack_ship;
                    }else {
                        speler.vsAv = 0;
                    }
                    if(availableUnits.harpy) {
                        speler.harpAv = availableUnits.harpy;
                    }else {
                        speler.harpAv = 0;
                    }
                    if(availableUnits.griffin) {
                        speler.grifAv = availableUnits.griffin;
                    }else {
                        speler.grifAv = 0;
                    }
                    if(availableUnits.matnicore) {
                        speler.mantiAv = availableUnits.manticore;
                    }else {
                        speler.mantiAv = 0;
                    }
                    UpdateSpelerAv(speler);
                    setTimeout(() => {
                        GetSpelers();
                    }, 1000);
                }
                message.delete();
                break;
            case 'update':
                let allUnits = JSON.parse(message.content.substring(8));
                if (typeof speler === 'undefined') {
                    message.channel.send(`Kon de troepen van ${username} niet updaten! Gebruik !setName 'username' om je naam in te stellen.`);
                } else {
                    if(allUnits.sword) {
                        speler.zwTot = allUnits.sword;
                    }else {
                        speler.zwTot = 0;
                    }
                    if(allUnits.archer) {
                        speler.boogTot = allUnits.archer;
                    }else {
                        speler.boogTot = 0;
                    }
                    if(allUnits.hoplite) {
                        speler.hoopTot = allUnits.hoplite;
                    }else {
                        speler.hoopTot = 0;
                    }
                    if(allUnits.bireme) {
                        speler.birTot = allUnits.bireme;
                    }else {
                        speler.birTot = 0;
                    }
                    if(allUnits.chariot) {
                        speler.karTot = allUnits.chariot;
                    }else {
                        speler.karTot = 0;
                    }
                    UpdateSpelerAll(speler);
                    setTimeout(() => {
                        GetSpelers();
                    }, 1000);
                }
                message.delete();
                break;
            case 'help':
                if (!args[0]) return message.channel.send('typ in !help -command- voor meer info over dat command of vraag een admin hierover!');
                break;
        }
    }
})

// grepolis functions
function SpelersMythenInfoAvailable(spelers) {
    const embed = new Discord.MessageEmbed()
        .setTitle("Mythische eenheden")
        .setColor(0x00AE86);

    let harps = '';
    let totalHarps = 0;
    let totalKippetjes = 0;
    let totalMantis = 0;
    let users = '';
    let grifs = '';

    for (i = 0; i < spelers.length; i++) {
        let mythen = { harps: spelers[i].harpAv, kippetjes: spelers[i].grifAv, mantis: spelers[i].mantiAv };
        if (typeof mythen.harps === 'undefined' || mythen.harps === null) {
            mythen.harps = '0';
        }
        if (typeof mythen.kippetjes === 'undefined' || mythen.kippetjes === null) {
            mythen.kippetjes = '0';
        }
        if (typeof mythen.mantis === 'undefined' || mythen.mantis === null) {
            mythen.mantis = '0';
        }

        totalHarps += parseInt(mythen.harps);
        totalKippetjes += parseInt(mythen.kippetjes);
        totalMantis += parseInt(mythen.mantis);
        users += spelers[i].naam + '\n';
        harps += mythen.harps + '\n';
        grifs += mythen.kippetjes + ' ' + '|' + ' ' + mythen.mantis + '\n';
    }

    embed.addField('Speler', users, true);
    embed.addField('Harps', harps, true);
    embed.addField('Grifs | Mantis', grifs, true);
    embed.addField('Totaal', `Harpijen: ${totalHarps}\nGriffioenen: ${totalKippetjes}\nManticores: ${totalMantis}`);

    return embed;
}

function SpelersVSInfoAvailable(spelers) {
    const embed = new Discord.MessageEmbed()
        .setTitle("Vuurschepen")
        .setColor(0x00AE86);

    let res = '';
    let totalvs = 0;
    let users = '';

    for (i = 0; i < spelers.length; i++) {
        var vs = spelers[i].vsAv;
        if (typeof vs === 'undefined' || vs === null) {
            vs = '0';
        }
        totalvs += parseInt(vs);
        users += spelers[i].naam + '\n';
        res += vs + '\n';
    }

    embed.addField('Speler', users, true);
    embed.addField('VS', res, true);
    embed.addField('Totaal', `${totalvs}`);

    return embed;
}

function SpelersDeffInfoAvailable(spelers) {
    const embed = new Discord.MessageEmbed()
        .setTitle("Beschikbare deff")
        .setColor(0x00AE86);

    let res = '';
    let totalltd = 0;
    let totalbirs = 0;
    let totalZw = 0;
    let totalBoog = 0;
    let totalHops = 0;
    let totalKarren = 0;
    let users = '';
    let bir = '';

    for (i = 0; i < spelers.length; i++) {
        let defftroepen = { zwaard: spelers[i].zwAv, boog: spelers[i].boogAv, hops: spelers[i].hopAv, birs: spelers[i].birAv, karren: spelers[i].karAv };
        if (typeof defftroepen.zwaard === 'undefined' || defftroepen.zwaard === null) {
            defftroepen.zwaard = '0';
        }
        if (typeof defftroepen.boog === 'undefined' || defftroepen.zwaard === null) {
            defftroepen.boog = '0';
        }
        if (typeof defftroepen.hops === 'undefined' || defftroepen.hops === null) {
            defftroepen.hops = '0';
        }
        if (typeof defftroepen.birs === 'undefined' || defftroepen.birs === null) {
            defftroepen.birs = '0';
        }
        if (typeof defftroepen.karren === 'undefined' || defftroepen.karren === null) {
            defftroepen.karren = '0';
        }
        let spelersLtd = parseInt(defftroepen.zwaard) + parseInt(defftroepen.boog) + parseInt(defftroepen.hops) + (parseInt(defftroepen.karren) * 4);
        let spelersBirs = defftroepen.birs;
        totalltd += parseInt(spelersLtd);
        totalbirs += parseInt(spelersBirs);
        totalZw += parseInt(defftroepen.zwaard);
        totalKarren += parseInt(defftroepen.karren);
        totalBoog += parseInt(defftroepen.boog);
        totalHops += parseInt(defftroepen.hops);
        users += spelers[i].naam + '\n';
        res += spelersLtd + '\n';
        bir += spelersBirs + '\n';
    }

    let totaal = `Totaal zwaard: ${totalZw}\nTotaal boog: ${totalBoog}\nTotaal hops: ${totalHops}\nTotaal karren: ${totalKarren}\n\nAlles: ${totalltd}\n\nTotaal biremen: ${totalbirs}\n`

    embed.addField('Speler', users, true);
    embed.addField('Troepen', res, true);
    embed.addField('Biremen', bir, true);
    embed.addField('Totaal', totaal);

    return embed;
}

function SpelersDeffInfoAll(spelers) {
    const embed = new Discord.MessageEmbed()
        .setTitle("Alle deff")
        .setColor(0x00AE86);

    let res = '';
    let totalltd = 0;
    let totalbirs = 0;
    let totalZw = 0;
    let totalBoog = 0;
    let totalKarren = 0;
    let totalHops = 0;
    let users = '';
    let bir = '';

    for (i = 0; i < spelers.length; i++) {
        let defftroepen = { zwaard: spelers[i].zwTot, boog: spelers[i].boogTot, hops: spelers[i].hopTot, birs: spelers[i].birTot, karren: spelers[i].karTot };
        if (typeof defftroepen.zwaard === 'undefined' || defftroepen.zwaard === null) {
            defftroepen.zwaard = '0';
        }
        if (typeof defftroepen.boog === 'undefined' || defftroepen.zwaard === null) {
            defftroepen.boog = '0';
        }
        if (typeof defftroepen.hops === 'undefined' || defftroepen.hops === null) {
            defftroepen.hops = '0';
        }
        if (typeof defftroepen.birs === 'undefined' || defftroepen.birs === null) {
            defftroepen.birs = '0';
        }
        if (typeof defftroepen.karren === 'undefined' || defftroepen.karren === null) {
            defftroepen.karren = '0';
        }
        let spelersLtd = parseInt(defftroepen.zwaard) + parseInt(defftroepen.boog) + parseInt(defftroepen.hops) + (parseInt(defftroepen.karren) * 4);
        let spelersBirs = defftroepen.birs;
        totalltd += parseInt(spelersLtd);
        totalbirs += parseInt(spelersBirs);
        totalZw += parseInt(defftroepen.zwaard);
        totalBoog += parseInt(defftroepen.boog);
        totalHops += parseInt(defftroepen.hops);
        totalKarren += parseInt(defftroepen.karren);
        users += spelers[i].naam + '\n';
        res += spelersLtd + '\n';
        bir += spelersBirs + '\n';
    }

    let totaal = `Totaal zwaard: ${totalZw}\nTotaal boog: ${totalBoog}\nTotaal hops: ${totalHops}\nTotaal karren: ${totalKarren}\n\nAlles: ${totalltd}\n\nTotaal biremen: ${totalbirs}\n`

    embed.addField('Speler', users, true);
    embed.addField('Troepen', res, true);
    embed.addField('Biremen', bir, true);
    embed.addField('Totaal', totaal);

    return embed;
}

// persistence
// TODO: for prod afschermen
var con = mysql.createConnection({
    host: "DB_HOST",
    user: "DB_USER",
    password: "DB_PASSWORD",
    database: "DATABASE"
});

function GetSpelers() {
    con.query('SELECT * FROM spelers', (err, result) => {
        if (err) {
            console.log("fout bij getSpelers");
            throw err;
        }
        var string = JSON.stringify(result);
        var json = JSON.parse(string);
        alleSpelers = json;
        try {
            beschikbaarChannel.bulkDelete(100);
            beschikbaarChannel.send(SpelersDeffInfoAvailable(alleSpelers));
            vsChannel.bulkDelete(100);
            vsChannel.send(SpelersVSInfoAvailable(alleSpelers));
            mythenChannel.bulkDelete(100);
            mythenChannel.send(SpelersMythenInfoAvailable(alleSpelers));
            deffChannel.bulkDelete(100);
            deffChannel.send(SpelersDeffInfoAll(alleSpelers));
        } catch (err) {
            console.log(err);
        }
    });
}

function InsertSpeler(speler) {
    con.query("INSERT INTO spelers SET ?", speler, function (err, result) {
        if (err) {
            console.log("fout bij insertSpeler");
            throw err;
        }
    });
}

function UpdateSpelerAv(speler) {
    var values = [speler.zwAv, speler.boogAv, speler.hopAv, speler.karAv, speler.birAv, speler.harpAv, speler.grifAv, speler.mantiAv,speler.vsAv, speler.id];
    console.log("update speler: " + speler.naam);
    con.query(
        'UPDATE spelers SET zwAv = ?, boogAv = ?, hopAv = ?, karAv = ?, birAv = ?, harpAv = ?, grifAv = ?, mantiAv = ?, vsAv = ? WHERE id = ?', values,
        (err, result) => {
            if (err) {
                console.log("fout bij updateSpelerAv");
                throw err;
            }
        }
    );
}

function UpdateSpelerAll(speler) {
    var values = [speler.zwTot, speler.boogTot, speler.hopTot, speler.karTot, speler.birTot, speler.id];
    console.log("update speler: " + speler.naam);
    con.query(
        'UPDATE spelers SET zwTot = ?, boogTot = ?, hopTot = ?, karTot = ?, birTot = ? WHERE id = ?', values,
        (err, result) => {
            if (err) {
                console.log("fout bij updateSpelerAll");
                throw err;
            }
        }
    );
}

// class
class Speler {
    constructor(id, naam) {
        this.id = id;
        this.naam = naam;
        this.boogAv = "0";
        this.zwAv = "0";
        this.hopAv = "0";
        this.karAv = "0";
        this.birAv = "0";
        this.harpAv = "0";
        this.grifAv = "0";
        this.mantiAv = "0";
        this.vsAv = "0";
        this.boogTot = "0";
        this.zwTot = "0";
        this.hopTot = "0";
        this.karTot = "0";
        this.birTot = "0";
    }
}