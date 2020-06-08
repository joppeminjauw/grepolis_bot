var Discord = require('discord.js');
var auth = require('./auth.json');
var Enum = require('enum');
const fs = require('fs');
const lineReader = require('line-reader');

const bot = new Discord.Client();
const prefix = '!';
var deffChannel;
var beschikbaarChannel;
var mythenChannel;
var slotsChannel;
var vsChannel;
var spelers = [];
var eilanden = [];
var lastUpdate;

var mogelijkeOceanen = ["A", "B", "C", "D"];

var troepenTypes = new Enum(
    {
        'ltd': "ltd",
        'birs': "biremen",
        'vs': "vs",
        'mantis': "mantis",
        'kip': "griffioenen",
        'harps': "harpies",
        'ltoff': "ltoff",
        'kolo': "Kolo",
        'mixdeff': "mixdeff"
    });

var channels = new Enum(
    {
        'troepenTotaal': "deff",
        'troepenbeschikbaar': "deff-beschikbaar",
        'troepenvs': "vs",
        'troepenmyth': "myth",
        'slotjes': "cultuurlevels"
    });

function Speler(id, naam) {
    this.id = id;
    this.naam = naam;
    this.dorpen = [];
    this.unitsAll = [];
    this.unitsAvailable = [];
    this.openSlots = 0;
}

function Eiland(eilandNr) {
    this.eilandNr = eilandNr;
    this.spelers = [];
}

function Dorp(oceaanGedeelte, eilandNr, troepen, versie = 'a') {
    this.oceaanGedeelte = oceaanGedeelte;
    this.eilandNr = eilandNr;
    this.troepen = troepen;
    this.versie = versie;
}

function SpelerExists(id) {
    if (getSpeler(id)) {
        return true;
    } else {
        return false;
    }
}

function EilandExists(eilandNr) {
    if (getEiland(eilandNr)) {
        return true;
    } else {
        return false;
    }
}

function dorpExists(eilandNr, spelersId, versie) {
    let speler = getSpeler(spelersId);

    if (getDorp(eilandNr, speler, versie)) {
        return true;
    } else {
        return false;
    }
}

//aanpassen
function getSpelersDeffAll(id) {
    let speler = spelers.find(s => s.id === id);
    let defftroepen;

    defftroepen = { zwaard: speler.unitsAll.sword, boog: speler.unitsAll.archer, hops: speler.unitsAll.hoplite, birs: speler.unitsAll.bireme, karren: speler.unitsAll.chariot };
    if (typeof defftroepen.zwaard === 'undefined') {
        defftroepen.zwaard = 0;
    }
    if (typeof defftroepen.boog === 'undefined') {
        defftroepen.boog = 0;
    }
    if (typeof defftroepen.hops === 'undefined') {
        defftroepen.hops = 0;
    }
    if (typeof defftroepen.birs === 'undefined') {
        defftroepen.birs = 0;
    }
    if (typeof defftroepen.karren === 'undefined') {
        defftroepen.karren = 0;
    }
    return defftroepen;
}
function getSpelersMythenAvailable(id) {
    let speler = spelers.find(s => s.id === id);
    let mythen;

    mythen = { harps: speler.unitsAvailable.harpy, kippetjes: speler.unitsAvailable.griffin, mantis: speler.unitsAvailable.manticore };
    if (typeof mythen.harps === 'undefined') {
        mythen.harps = 0;
    }
    if (typeof mythen.kippetjes === 'undefined') {
        mythen.kippetjes = 0;
    }
    if (typeof mythen.mantis === 'undefined') {
        mythen.mantis = 0;
    }
    return mythen;
}
function getSpelersVSAvailable(id) {
    let speler = spelers.find(s => s.id === id);
    let vs;

    vs = speler.unitsAvailable.attack_ship;
    if (typeof vs === 'undefined') {
        vs = 0;
    }
    return vs;
}

function getSpelersDeffAvailable(id) {
    let speler = spelers.find(s => s.id === id);
    let defftroepen;

    defftroepen = { zwaard: speler.unitsAvailable.sword, boog: speler.unitsAvailable.archer, hops: speler.unitsAvailable.hoplite, birs: speler.unitsAvailable.bireme, karren: speler.unitsAvailable.chariot };
    if (typeof defftroepen.zwaard === 'undefined') {
        defftroepen.zwaard = 0;
    }
    if (typeof defftroepen.boog === 'undefined') {
        defftroepen.boog = 0;
    }
    if (typeof defftroepen.hops === 'undefined') {
        defftroepen.hops = 0;
    }
    if (typeof defftroepen.birs === 'undefined') {
        defftroepen.birs = 0;
    }
    if (typeof defftroepen.karren === 'undefined') {
        defftroepen.karren = 0;
    }
    return defftroepen;
}

function getSpelersOff(id) {
    let speler = spelers.find(s => s.id === id);
    let offtroepen;

    offtroepen = { slingers: speler.unitsAll.slinger, ruiters: speler.unitsAll.rider, vs: speler.unitsAll.attack_ship };
    if (typeof offtroepen.slingers === 'undefined') {
        offtroepen.slingers = 0;
    }
    if (typeof offtroepen.ruiters === 'undefined') {
        offtroepen.ruiters = 0;
    }
    if (typeof offtroepen.vs === 'undefined') {
        offtroepen.vs = 0;
    }
    return offtroepen;
}

function getSpelersMythe(id) {
    let speler = spelers.find(s => s.id === id);
    let mythen;

    mythen = { harps: speler.unitsAll.harpy, kippetjes: speler.unitsAll.griffin, mantis: speler.unitsAll.manticore };
    if (typeof mythen.harps === 'undefined') {
        mythen.harps = 0;
    }
    if (typeof mythen.kippetjes === 'undefined') {
        mythen.kippetjes = 0;
    }
    if (typeof mythen.mantis === 'undefined') {
        mythen.mantis = 0;
    }
    return mythen;
}

function SpelersMythenInfoAvailable(spelers) {
    const embed = new Discord.RichEmbed()
    .setTitle("Mythische eenheden")
    .setDescription(`Mythische eenheden op ${lastUpdate}`)
    .setColor(0x00AE86);

    let harps = '';
    let totalHarps = 0;
    let totalKippetjes = 0;
    let totalMantis = 0;
    let users = '';
    let grifs = '';
    let mantis = '';

    for (i = 0; i < spelers.length; i++) {
        let mythen = getSpelersMythenAvailable(spelers[i].id);

        totalHarps += mythen.harps;
        totalKippetjes += mythen.kippetjes;
        totalMantis += mythen.mantis;
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
    const embed = new Discord.RichEmbed()
    .setTitle("Vuurschepen")
    .setDescription(`Vuurschepen op ${lastUpdate}`)
    .setColor(0x00AE86);

    let res = '';
    let totalvs = 0;
    let users = '';

    for (i = 0; i < spelers.length; i++) {
        let vs = getSpelersVSAvailable(spelers[i].id);

        totalvs += vs;
        users += spelers[i].naam + '\n';
        res += vs + '\n';
    }

    embed.addField('Speler', users, true);
    embed.addField('VS', res, true);
    embed.addField('Totaal', `${totalvs}`);

    return embed;
}

function SpelersDeffInfoAvailable(spelers) {
    const embed = new Discord.RichEmbed()
    .setTitle("Beschikbare deff")
    .setDescription(`Beschikbare deff op ${lastUpdate}`)
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
        let defftroepen = getSpelersDeffAvailable(spelers[i].id);
        let spelersLtd = defftroepen.zwaard + defftroepen.boog + defftroepen.hops + (defftroepen.karren * 4);
        let spelersBirs = defftroepen.birs;
        totalltd += spelersLtd;
        totalbirs += spelersBirs;
        totalZw += defftroepen.zwaard;
        totalKarren += defftroepen.karren;
        totalBoog += defftroepen.boog;
        totalHops += defftroepen.hops;
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

//aanpassen
function SpelersDeffInfoAll(spelers) {
    const embed = new Discord.RichEmbed()
    .setTitle("Alle deff")
    .setDescription(`Alle deff op ${lastUpdate}`)
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
        let defftroepen = getSpelersDeffAll(spelers[i].id);
        let spelersLtd = defftroepen.zwaard + defftroepen.boog + defftroepen.hops + (defftroepen.karren * 4);
        let spelersBirs = defftroepen.birs;
        totalltd += spelersLtd;
        totalbirs += spelersBirs;
        totalZw += defftroepen.zwaard;
        totalBoog += defftroepen.boog;
        totalHops += defftroepen.hops;
        totalKarren += defftroepen.karren;
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

function AddSpelerToEiland(spelersId, eilandNr) {
    let speler = getSpeler(spelersId);
    getEiland(eilandNr).spelers.push(speler);
}

function SpelerOpEiland(userId, eilandNr) {

    for (i = 0; i < eilanden.length; i++) {
        if (EilandExists(eilandNr)) {
            let eiland = getEiland(eilandNr);
            for (j = 0; j < eiland.spelers.length; j++) {
                if (eiland.spelers[j].id === userId) {
                    return true;
                }
            }
        }
    }
    return false;
}

function setSpelersDorp(eilandNr, spelersId, versie, troepensoort) {
    let speler = getSpeler(spelersId);
    let dorp = getDorp(eilandNr, speler, versie);

    dorp.troepen = troepensoort;
    //console.log(dorp.troepen);
}

function SetChannelName(eilandNr) {
    if (eilandNr >= 0 && eilandNr <= 10) {
        return '000-010';
    } else if (eilandNr > 10 && eilandNr <= 20) {
        return '011-020';
    } else if (eilandNr > 20 && eilandNr <= 30) {
        return '021-030';
    } else if (eilandNr > 30 && eilandNr <= 40) {
        return '031-040';
    } else if (eilandNr > 40 && eilandNr <= 50) {
        return '041-050';
    } else if (eilandNr > 50 && eilandNr <= 60) {
        return '051-060';
    } else if (eilandNr > 60 && eilandNr <= 70) {
        return '061-070';
    } else if (eilandNr > 70 && eilandNr < 80) {
        return '071-079';
    }
}
function getEiland(eilandNr) {
    return eilanden.find(x => x.eilandNr === eilandNr);
}

function getSpeler(id) {
    return spelers.find(x => x.id === id);
}

function getDorp(eilandNr, speler, versie) {
    return speler.dorpen.find(x => x.eilandNr === eilandNr && x.versie === versie);
}

function kanaalOverzicht(eilandNr, channel) {
    let eiland;

    if (eilandNr >= 0 && eilandNr <= 10) {
        for (i = 0; i <= 10; i++) {
            eiland = getEiland(i);
            if (typeof eiland !== 'undefined') {
                console.log("eiland " + eiland.eilandNr);
                if (typeof eiland.spelers !== 'undefined' && eiland.spelers.length > 0) {
                    console.log("met spelers " + eiland.spelers);
                    channel.sendEmbed(eilandOverzicht(eiland));
                    //methode om steden op eiland weer te geven in mooi rooster
                }
            }
        }

    } else if (eilandNr > 10 && eilandNr <= 20) {
        for (i = 11; i <= 20; i++) {
            eiland = getEiland(i);
            if (typeof eiland !== 'undefined') {
                console.log("eiland " + eiland.eilandNr);
                if (typeof eiland.spelers !== 'undefined' && eiland.spelers.length > 0) {
                    console.log("met spelers " + eiland.spelers);
                    channel.sendEmbed(eilandOverzicht(eiland));
                    //methode om steden op eiland weer te geven in mooi rooster
                }
            }
        }

    } else if (eilandNr > 20 && eilandNr <= 30) {
        for (i = 21; i <= 30; i++) {
            eiland = getEiland(i);
            if (typeof eiland !== 'undefined') {
                console.log("eiland " + eiland.eilandNr);
                if (typeof eiland.spelers !== 'undefined' && eiland.spelers.length > 0) {
                    console.log("met spelers " + eiland.spelers);
                    channel.sendEmbed(eilandOverzicht(eiland));
                    //methode om steden op eiland weer te geven in mooi rooster
                }
            }
        }

    } else if (eilandNr > 30 && eilandNr <= 40) {
        for (i = 31; i <= 40; i++) {
            eiland = getEiland(i);
            if (typeof eiland !== 'undefined') {
                console.log("eiland " + eiland.eilandNr);
                if (typeof eiland.spelers !== 'undefined' && eiland.spelers.length > 0) {
                    console.log("met spelers " + eiland.spelers);
                    channel.sendEmbed(eilandOverzicht(eiland));
                    //methode om steden op eiland weer te geven in mooi rooster
                }
            }
        }

    } else if (eilandNr > 40 && eilandNr <= 50) {
        for (i = 41; i <= 50; i++) {
            eiland = getEiland(i);
            if (typeof eiland !== 'undefined') {
                console.log("eiland " + eiland.eilandNr);
                if (typeof eiland.spelers !== 'undefined' && eiland.spelers.length > 0) {
                    console.log("met spelers " + eiland.spelers);
                    channel.sendEmbed(eilandOverzicht(eiland));
                    //methode om steden op eiland weer te geven in mooi rooster
                }
            }
        }

    } else if (eilandNr > 50 && eilandNr <= 60) {
        for (i = 51; i <= 60; i++) {
            eiland = getEiland(i);
            if (typeof eiland !== 'undefined') {
                console.log("eiland " + eiland.eilandNr);
                if (typeof eiland.spelers !== 'undefined' && eiland.spelers.length > 0) {
                    console.log("met spelers " + eiland.spelers);
                    channel.sendEmbed(eilandOverzicht(eiland));
                    //methode om steden op eiland weer te geven in mooi rooster
                }
            }
        }

    } else if (eilandNr > 60 && eilandNr <= 70) {
        for (i = 61; i <= 70; i++) {
            eiland = getEiland(i);
            if (typeof eiland !== 'undefined') {
                console.log("eiland " + eiland.eilandNr);
                if (typeof eiland.spelers !== 'undefined' && eiland.spelers.length > 0) {
                    console.log("met spelers " + eiland.spelers);
                    channel.sendEmbed(eilandOverzicht(eiland));
                    //methode om steden op eiland weer te geven in mooi rooster
                }
            }
        }

    } else if (eilandNr > 70 && eilandNr < 80) {
        for (i = 71; i <= 79; i++) {
            eiland = getEiland(i);
            if (typeof eiland !== 'undefined') {
                console.log("eiland " + eiland.eilandNr);
                if (typeof eiland.spelers !== 'undefined' && eiland.spelers.length > 0) {
                    console.log("met spelers " + eiland.spelers);
                    channel.sendEmbed(eilandOverzicht(eiland));
                    //methode om steden op eiland weer te geven in mooi rooster
                }
            }
        }

    }
}

function eilandOverzicht(eiland) {
    let embed = new Discord.RichEmbed().setColor(0x47F70E);
    let speler;

    embed.setTitle(`StedenInfo Eiland ${eiland.eilandNr}`)

    for (j = 0; j < eiland.spelers.length; j++) {
        speler = eiland.spelers[j];
        embed.addField(speler.naam, dorpenOverzichtSpeler(speler, eiland.eilandNr));
    }
    return embed;
}

function dorpenOverzichtSpeler(speler, eilandNr) {
    let res = "";
    let dorp;
    let dorpenEiland = speler.dorpen.filter(eiland => { return eiland.eilandNr === eilandNr }); // #dorpen op bepaald eiland
    let dorpIcon;

    for (d = 0; d < dorpenEiland.length; d++) {
        dorp = dorpenEiland[d];

        if (Object.keys(troepenTypes).some((t) => t === dorp.troepen.toLowerCase())) {
            dorpIcon = troepenTypes.getValue(dorp.troepen);
        } else {
            dorpIcon = dorp.troepen;
        }

        res += (d + 1) + ".  " + dorp.eilandNr + " azn " + (dorp.versie === "a" ? "" : ("(" + dorp.versie + ")")) + "   -->     " + dorpIcon + '\n';
        //console.log(res);
    }
    return res;
}

function refreshSlotjes() {
    let res = `----------${lastUpdate}----------\n`;
    let totalSlotjes = 0;

    for (i = 0; i < spelers.length; i++) {
        let slotjes = (typeof spelers[i].openSlots === 'undefined') ? 0 : spelers[i].openSlots;
        totalSlotjes += slotjes;
        res += spelers[i].naam + ': ' + slotjes + ' slotjes \n';
    }

    res += `--------------------------------------------\nTotaal = ${totalSlotjes} vrije slotjes\n--------------------------------------------\n`
    return res;
}

//aanpassen
function WriteSpelersToFile(lijst) {
    let today = new Date();
    lastUpdate = today.toLocaleDateString() + ' om ' + today.toLocaleTimeString();
    let content = 'date ' + lastUpdate + '\n';

    for (i = 0; i < lijst.length; i++) {
        content += 'speler ' + lijst[i].id + ' ' + lijst[i].naam + '\n';
        if (typeof lijst[i].unitsAll !== 'undefined') {
            content += 'unitsAll ' + JSON.stringify(lijst[i].unitsAll) + '\n';
        }
        if (typeof lijst[i].unitsAvailable !== 'undefined') {
            content += 'unitsAvailable ' + JSON.stringify(lijst[i].unitsAvailable) + '\n';
        }
        if (typeof lijst[i].dorpen !== 'undefined' && lijst[i].dorpen.length > 0) {
            for (j = 0; j < lijst[i].dorpen.length; j++) {
                content += 'dorp ' + lijst[i].dorpen[j].oceaanGedeelte + ' ' + lijst[i].dorpen[j].eilandNr + ' ' + lijst[i].dorpen[j].versie + ' ' + lijst[i].dorpen[j].troepen + '\n';
            }
        }
    }
    fs.writeFile("./spelersLijst.txt", content, function (err) {
        if (err) {
            return console.log(err);
        }
        console.log("The file was saved!");
    });
}

//aanpassen
function ReadFromFile() {
    console.log('read function!');
    lineReader.eachLine('./spelersLijst.txt', function (line) {
        if (line.includes('date')) {
            let elements = line.split(' ');
            lastUpdate = elements[1] + ' op ' + elements[3];
        } else if (line.includes('speler')) {
            let elements = line.split(' ');
            let naam = "";
            if (elements.length === 3) {
                naam = elements[2];
            } else {
                for (i = 2; i < elements.length; i++) {
                    naam += elements[i] + " ";
                }
                naam.trim();
            }
            let speler = new Speler(elements[1], naam);
            spelers.push(speler);
        } else if (line.includes('unitsAll')) {
            //console.log(line.substring(9));
            if (line.substring(9) !== '[]') {
                let units = JSON.parse(line.substring(9));
                let speler = spelers[spelers.length - 1];
                speler.unitsAll = units;
            }
        } else if (line.includes('unitsAvailable')) {
            //console.log(line.substring(15));
            if (line.substring(15) !== '[]') {
                let units = JSON.parse(line.substring(15));
                let speler = spelers[spelers.length - 1];
                speler.unitsAvailable = units;
            }
        } else if (line.includes('dorp')) {
            let elements = line.split(' ');
            let dorp = new Dorp(elements[1], Number.parseInt(elements[2]), elements[4], elements[3]);
            spelers[spelers.length - 1].dorpen.push(dorp);
        }
    });

    //Addspelertoeiland onder dorpline zetten???
    for (s = 0; s < spelers.length; s++) {
        for (d = 0; d < spelers[s].dorpen.length; d++) {
            if (!SpelerOpEiland(spelers[s].spelersId, d.eilandNr)) {
                AddSpelerToEiland(spelers[s].spelersId, d.eilandNr);
            }
        }
    }
}

bot.on("guildMemberAdd", member => {

    //???
    const welkomchannel = bot.channels.find(c => c.name === "general");
    welkomchannel.send(`Welkom ${member}, Doe even snel !setName 'grepo-naam' om gebruik te kunnen maken van mij!`);

    let nieuwSpeler = new Speler(member.user.id, member.user.username);
    spelers.push(nieuwSpeler);
})

bot.on('ready', () => {
    console.log('online!');
    ReadFromFile();
    deffChannel = bot.channels.find('name', channels.getValue('troepenTotaal'));
    beschikbaarChannel = bot.channels.find('name', channels.getValue('troepenbeschikbaar'));
    mythenChannel = bot.channels.find('name', channels.getValue('troepenmyth'));
    vsChannel = bot.channels.find('name', channels.getValue('troepenvs'));
    slotsChannel = bot.channels.find('name', channels.getValue('slotjes'));
})

bot.on('message', message => {
    let msgPrefix = message.content.substring(0, 1);
    let args = message.content.substring(prefix.length).split(' ');
    let username = message.author.username;
    let speler
    try {
        speler = spelers.find(s => s.naam === username);
    } catch (e) {
        message.channel.sendMessage("Geef je grepo naam op met commando !addMe 'greponaam'!");
    }



    if (msgPrefix === prefix) {

        var cmd = args[0];

        args = args.splice(1);
        switch (cmd) {
            case 'addMe':
                if (!args[0]) {
                    message.channel.sendMessage("Geef je grepo naam op met commando !addMe 'greponaam'!");
                } else {
                    if (SpelerExists(message.author.id)) {
                        message.channel.sendMessage("Je bestaat al!");
                    } else {
                        let spelersnaam = message.content.substring(7);
                        let speler = new Speler(message.author.id, spelersnaam);
                        spelers.push(speler);
                        WriteSpelersToFile(spelers);
                    }
                }
                message.react('âœ…').then(message.delete(3000));
                break;
            case 'setName':
                let naam = message.content.substring(9);
                console.log(naam);
                if (!args[0]) {
                    message.delete(3000);
                    message.reply("Je moet wel een naam opgeven pik!").then(r => r.delete(3000));
                } else {
                    try {
                        message.react('âœ…').then(message.delete(3000));
                        let speler = spelers.find(s => s.id === message.author.id);
                        if(typeof speler !== "undefined"){
                            speler.naam = naam;
                            WriteSpelersToFile(spelers);
                        }else{
                            message.channel.sendMessage("Je zit nog niet in de database, Geef je grepo naam op met commando !addMe 'greponaam'!");
                        }
                    } catch (e) {
                        message.channel.sendMessage("Geef je grepo naam op met commando !addMe 'greponaam'!");
                    }
                }
                break;
            case 'thuis':

            console.log(deffChannel.id);
                let availableUnits = JSON.parse(message.content.substring(7));

                if (typeof speler === 'undefined') {
                    message.channel.sendMessage(`Kon de troepen van ${username} niet updaten! Gebruik !setName 'username' om je naam in te stellen.`);
                } else {
                    //test this out????
                    speler.unitsAvailable = availableUnits;
                    try {
                        beschikbaarChannel.bulkDelete(100);
                        beschikbaarChannel.send(SpelersDeffInfoAvailable(spelers));
                        vsChannel.bulkDelete(100);
                        vsChannel.send(SpelersVSInfoAvailable(spelers));
                        mythenChannel.bulkDelete(100);
                        mythenChannel.send(SpelersMythenInfoAvailable(spelers));

                    } catch (err) {
                        message.channel.sendMessage("er ging iets mis, contacteer de maker van JoppeBot!");
                        console.log("error refreshing defchannel!!");
                    }
                    WriteSpelersToFile(spelers);
                }
                message.delete(200);
                break;
            case 'update':
                //let username = message.author.username;
                let allUnits = JSON.parse(message.content.substring(8));
                //console.log(allUnits.sword);
                //let speler = spelers.find(s => s.naam === username);
                if (typeof speler === 'undefined') {
                    message.channel.sendMessage(`Kon de troepen van ${username} niet updaten! Gebruik !setName 'username' om je naam in te stellen.`);
                } else {
                    //test this out????
                    speler.unitsAll = allUnits;
                    const embed = SpelersDeffInfoAll(spelers);
                    try {
                        deffChannel.bulkDelete(100);
                        deffChannel.send(SpelersDeffInfoAll(spelers));
                    } catch (err) {
                        message.channel.sendMessage("er ging iets mis, contacteer de maker van Grepo Bot!!");
                        console.log("error refreshing defchannel!!");
                    }
                    WriteSpelersToFile(spelers);
                }
                message.delete(200);
                break;
            case 'help':
                if (!args[0]) return message.channel.sendMessage('typ in !help -command- voor meer info over dat command of vraag een admin hierover!');
                break;
            // case 'dorp':
            //     if (!args[0] || !args[1] || !args[2]) {
            //         message.channel.sendMessage("geef argumenten 'oceaangedeelte' 'eilandnr' 'soort troepen' en 'versie' mee. Vb: !dorp A 064 ltoff b");
            //     } else if (!isNaN(args[1])) {
            //         let oceaanGedeelte = args[0];
            //         let eilandNr = Number.parseInt(args[1]);
            //         let versie = typeof args[3] !== 'undefined' ? args[3] : "a";
            //         let troepensoort = args[2];

            //         if (!Object.keys(troepenTypes).some((t) => t === troepensoort.toLowerCase())) {
            //             message.reply("Kies voor 'troepensoort' uit: kolo, ltoff, ltd, birs, mythen, mixdeff of vs!");
            //             break;
            //         }

            //         let dorp;
            //         //console.log(eilandNr + " " + troepensoort + " " + versie);

            //         if (!mogelijkeOceanen.includes(oceaanGedeelte.toUpperCase())) {
            //             message.reply("Kies voor 'OceaanGedeelte' uit: A, B, C of D!");
            //             break;
            //         }
            //         if (!EilandExists(eilandNr)) {
            //             let eiland = new Eiland(eilandNr);
            //             eilanden.push(eiland);
            //             console.log("eilandobject", eilanden);
            //         }
            //         if (!SpelerExists(message.author.id)) {
            //             // let speler = new Speler(message.author.id, message.author.username);
            //             // spelers.push(speler);
            //             message.author.sendMessage("Je moet nog eerst je grepo-naam opgeven met het command !setName 'grepo-naam'!!!")
            //             console.log("speler object", speler);
            //         }
            //         if (!SpelerOpEiland(message.author.id, eilandNr)) {
            //             AddSpelerToEiland(message.author.id, eilandNr);
            //             console.log("speler aan eiland toegevoegd");
            //         }
            //         if (!dorpExists(eilandNr, message.author.id, versie)) {
            //             dorp = new Dorp(oceaanGedeelte, eilandNr, troepensoort, versie);
            //             let speler = getSpeler(message.author.id);
            //             speler.dorpen.push(dorp);
            //             console.log(speler.dorpen);
            //         } else {
            //             setSpelersDorp(eilandNr, message.author.id, versie, troepensoort);
            //         }

            //         //console.log("dorpobject " + dorp);
            //         message.react('âœ…').then(message.delete(3000));

            //         //aanpassen
            //         WriteSpelersToFile(spelers);

            //         //oppassen met die eerste 0 in bv 015
            //         let channelName = SetChannelName(eilandNr);

            //         let eilandChannel = bot.channels.find('name', channelName);
            //         //console.log(eilandChannel.toString());
            //         try {
            //             eilandChannel.bulkDelete(100);
            //             console.log("Check");
            //             kanaalOverzicht(eilandNr, eilandChannel);
            //         } catch (err) {
            //             message.channel.sendMessage("er ging iets mis, contacteer de maker van Grepo Bot!!");
            //             console.log(err);
            //         }
            //     }
            //     break;
            // case 'setSlotjes':
            //     let slotjes = Number.parseInt(args[0])
            //     if (!args[0]) {
            //         message.reply("aantal slotjes moet ingevuld worden!");
            //     } else if (isNaN(slotjes)) {
            //         message.reply("aantal slotjes moet een nummer zijn!");
            //     } else {
            //         let spelerByName = spelers.find(s => s.id === message.author.id);
            //         if (typeof spelerByName === 'undefined') {
            //             message.reply("je staat nog niet in de lijst, doe eerst !addMe 'greponaam'");
            //             break;
            //         }
            //         spelerByName.openSlots = slotjes;
            //         message.react('âœ…').then(message.delete(3000));
            //         slotsChannel.bulkDelete(100);
            //         slotsChannel.send(refreshSlotjes());
            //     }
            //     break;
            // case 'createChannels':
            //     try {
            //         let category = message.guild.createChannel("-----Troepen Info------", "category");
            //         for (let channel in channels) {
            //             if (typeof channels.getValue(channel) !== 'undefined') {
            //                 //if (channels.getValue(channel).endsWith("Per Speler") && (await category).name === "-----Troepen Informatie-----") {
            //                     message.guild.createChannel(channels.getValue(channel), { type: 'text', parent: (await category).id });
            //                 //}
            //             }
            //         }
            //     } catch (e) {
            //         console.log(e.message);
            //     }
            //     break;
        }
    }
})
