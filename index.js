// CTBot by AlexDemon

// Importing the libraries needed for the bot to work
const discord = require('discord.js');
const mysql = require("mysql2");
const config = require('./config.json');
client = new discord.Client(); // Initializing the bot

var prefix = "??" // Here we create the default bot prefix
const api = "https://osu.ppy.sh/api/" // A variable for making the code shorter
const k = "" // This is the OSU key, if you want to test this, put yours

// Connecting the db if you want to test this, put yours
const conn = mysql.createPool({
    ssl: {
        rejectUnauthorized: false,
    }
})

client.on('ready', async () => {
    // Here it reads the saved prefix in the db
    conn.query("SELECT * FROM configs", (err, config) => {
        if (config.length!=0){
            prefix = config[0].prefix
        }
    })
})

// Here detects when a message is sent
client.on('message', message => {
    // Detects if the message starts with prefix, if not the data won't be used
    if (message.content.toLowerCase().startsWith(prefix)){
        // This variable detects the command after the prefix
        comando = message.content.slice(prefix.length).toLowerCase()
        comando = comando.split(" ")
        // If the command is 'help' sends a message with a list of available commands
        if (comando[0] == "help"){
            exampleEmbed = new discord.MessageEmbed()
                .setColor(0x0099FF)
                .setTitle("Comandos CTBot")
                .setDescription("Hola!, para poder usar CTBot cuentas con los siguientes comandos:\n - **"+prefix+"setprofile** y tu username o id para linkearte con el bot.\n - **"+prefix+"p / "+prefix+"profile** para ver tu perfil.\n - **"+prefix+"c / "+prefix+"sc / "+prefix+"score** para ver tu mejor play en un mapa anteriormente mencionado o tambien en un mapa el cual das el id.\n - **"+prefix+"rs / "+prefix+"recent** para ver tu play reciente.\n - **"+prefix+"help** para ver la ayuda.\n - **"+prefix+"top** para ver tus top plays y agrega (-2, -3), al final para ver una pagina en especifico.\n - **"+prefix+"prefix** para ver el prefijo actual.\n - **"+prefix+"setprefix** para cambiar el prefijo (maximo 2 caracteres).\n\nEso es todo, ahora ve y diviertete :D")
            message.channel.send(exampleEmbed);
        }
        // If the command is 'prefix' it sends a message with the current prefix
        if (comando[0] == "prefix"){
            message.channel.send("Prefijo: "+prefix)
        }
        // If the command is 'setprefix' detects the next word and if its 2 characters long or less it changes the prefix in the db, if isn't the bot will ask again
        if (comando[0] == "setprefix"){
            if (comando[1] == undefined){
                message.channel.send("Agrega un prefijo por favor.") // If there's not a prefix it will ask again
            }else{
                if (comando[1].length<=2){
                    prefix = comando[1]
                    // This is a function to check if the prefix is a character if it is, the bot will ask again
                    function letras(prefix){
                        for (x = 0; x < prefix.length; x++) {
                            c = prefix.charAt(x);
                            if (!((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c == ' ')) {
                                return false;
                            }
                        }
                        return true;
                    }
                    // If the prefix isn't a character neither a number, it will save it in the db
                    if (letras(prefix) == false && isNaN(prefix) == true){
                        conn.query("SELECT * FROM configs", (err, config) => {
                            if (config.length==0){
                                conn.query("INSERT INTO configs (prefix) VALUES ('"+prefix+"')")
                            }else{
                                conn.query("UPDATE configs SET prefix = ?", [prefix])
                            }
                        })
                        message.channel.send("Prefijo cambiado: "+prefix)
                    }else{
                        message.channel.send("Solo se pueden prefijos de simbolos")
                    }
                }else{
                    message.channel.send("Pon un prefijo de 1-2 caracteres por favor.")
                }
            }
        }
        // If the command is 'profile' it will read the linked osu id to the discord id, if there's nothing, it will ask again
        if (comando[0] == "profile" || comando[0] == "p" || comando[0] == "ctb"){
            // This is a function that sends the message and test if the user is in the api
            function perfil(u){
                fetch(api+"get_user?k="+k+"&u="+u+"&m=2")
                .then(function(response){
                    return response.json()
                }).then(function(data){
                    acc = parseFloat(data[0].accuracy)
                    // Here sends a message with all the profile data gotten by using the api
                    exampleEmbed = new discord.MessageEmbed()
                        .setColor(0x0099FF)
                        .setTitle("osu!ctb profile for "+data[0].username)
                        .setURL('https://osu.ppy.sh/users/'+data[0].user_id)
                        .setDescription(" - **Rank:** #"+data[0].pp_rank+" (:flag_"+data[0].country.toLowerCase()+": #"+data[0].pp_country_rank+")\n - **PP:** "+data[0].pp_raw+"\n - **Acc:** "+acc.toFixed(4)+"%\n - **Playcount:** "+data[0].playcount+"\n\n <:rankingXH:1028374879973683250>: "+data[0].count_rank_ssh+" <:rankingSH:1028374905596682321>: "+data[0].count_rank_sh+" <:rankingX:1028374894905413693>: "+data[0].count_rank_ss+" <:rankingS:1028374918322208779>: "+data[0].count_rank_s+" <:rankingA:1028374929533571205>:"+data[0].count_rank_a)
                        .setThumbnail('http://a.ppy.sh/'+data[0].user_id)
                    message.channel.send(exampleEmbed);
                }).catch(function(response){
                    message.channel.send("No existe el perfil.");
                })
            }
            // Here we crop the start of the message to get the profile name
            var u = comando.filter((item) => item !== 'p' && item !== 'profile' && item !== 'ctb').join(" ")
            // If the user is asking for a profile by mentioning another user
            if (u.length>0 && u.startsWith("<@")){
                u = u.slice(2)
                u = u.slice(0, -1)
                conn.query("SELECT * FROM users WHERE id = ?",[u], (err, user) => {
                    if (user.length>0){
                        u = user[0].profile
                        perfil(u)
                    }
                })
            // If the user is asking for a profile by writing the profile name or the osu id
            }else if (u.length>0){
                perfil(u)
            // If the user wants to see its own profile so there is no user
            }else{
                conn.query("SELECT * FROM users WHERE id = ?",[message.author.id], (err, user) => {
                    try{
                        u = user[0].profile
                        perfil(u)
                    } catch (err) {
                        message.channel.send("Linkea tu cuenta por favor.") // If the user is not in the db
                    }
                })
            }
        }
        // If the command is 'recent' it with will read all the needed data to show the recent play asked
        if (comando[0] == "recent" || comando[0] == "rs"){
            // This is a function that reads the user data, the map data and the play data to show it in a message, making 3 fetchs to the api
            function recent(u){
                // This is for getting the play data
                fetch(api+"get_user_recent?k="+k+"&u="+u+"&m=2")
                .then(function(response){
                    return response.json()
                }).then(function(dataplay){
                    // This is for getting the user data
                    fetch(api+"get_user?k="+k+"&u="+u+"&m=2")
                    .then(function(response){
                        return response.json()
                    }).then(function(datauser){
                        // This is for getting the map data
                        fetch(api+"get_beatmaps?k="+k+"&m=2&a=1&b="+dataplay[0].beatmap_id)
                        .then(function(response){
                            return response.json()
                        }).then(function(datamap){
                            sr = parseFloat(datamap[0].difficultyrating)
                            mods = parseInt(dataplay[0].enabled_mods)
                            mods = mods.toString(2).split("").reverse()
                            modstxt = ""
                            index = 0
                            // This is used to read the used mods in the play and put it in a text
                            mods.forEach(element => {
                                if (element != "0"){
                                    if (index==0){
                                        modstxt = modstxt.concat("NF")
                                    }
                                    if (index==1){
                                        modstxt = modstxt.concat("EZ")
                                    }
                                    if (index==3){
                                        modstxt = modstxt.concat("HD")
                                    }
                                    if (index==4){
                                        modstxt = modstxt.concat("HR")
                                    }
                                    if (index==5){
                                        modstxt = modstxt.concat("SD")
                                    }
                                    if (index==6){
                                        modstxt = modstxt.concat("DT")
                                    }
                                    if (index==8){
                                        modstxt = modstxt.concat("HT")
                                    }
                                    if (index==9){
                                        modstxt = modstxt.replace("DT","NC")
                                    }
                                    if (index==10){
                                        modstxt = modstxt.concat("FL")
                                    }
                                    if (index==14){
                                        modstxt = modstxt.concat("PF")
                                    }
                                    if (index==29){
                                        modstxt = modstxt.concat("SV2")
                                    }
                                }
                                index++;
                            });
                            if (mods == 0){
                                modstxt ="NM"
                            }
                            // This is used for putting the score emojis (currently is using the server where is located, if you want to test this, put your own emojis for each score)
                            if (dataplay[0].rank == "XH"){
                                rank = "<:rankingXH:1028374879973683250>"
                            }else if (dataplay[0].rank == "X"){
                                rank = "<:rankingX:1028374894905413693>"
                            }else if (dataplay[0].rank == "SH"){
                                rank = "<:rankingSH:1028374905596682321>"
                            }else if (dataplay[0].rank == "S"){
                                rank = "<:rankingS:1028374918322208779>"
                            }else if (dataplay[0].rank == "A"){
                                rank = "<:rankingA:1028374929533571205>"
                            }else if (dataplay[0].rank == "B"){
                                rank = "<:rankingB:1028374941625753710>"
                            }else if (dataplay[0].rank == "C"){
                                rank = "<:rankingC:1028374952354795550>"
                            }else if (dataplay[0].rank == "D"){
                                rank = "<:rankingD:1028374963297726535>"
                            }else if (dataplay[0].rank == "F"){
                                rank = "F"
                            }
                            // This is a calculus of the accuracy in the play
                            acc = (((parseInt(dataplay[0].count50)+parseInt(dataplay[0].count100)+parseInt(dataplay[0].count300))/(parseInt(dataplay[0].count50)+parseInt(dataplay[0].count100)+parseInt(dataplay[0].count300)+parseInt(dataplay[0].countmiss)+parseInt(dataplay[0].countkatu)))*100).toFixed(2)
                            linkplay = "https://osu.ppy.sh/beatmapsets/"+datamap[0].beatmapset_id+"#fruits/"+datamap[0].beatmap_id
                            // Here we recolect all information and send the final message
                            exampleEmbed = new discord.MessageEmbed()
                                .setColor(0x0099FF)
                                .setTitle(datamap[0].title+" ["+datamap[0].version+"] + "+modstxt+" ["+sr.toFixed(2)+"★]")
                                .setURL(linkplay)
                                .setDescription(rank+" Acc: "+acc+"% - Miss: "+dataplay[0].countmiss+", Dropmiss: "+dataplay[0].countkatu+"\n "+dataplay[0].score+" - "+dataplay[0].maxcombo+"/"+datamap[0].max_combo+" - ["+dataplay[0].count300+"/"+dataplay[0].count100+"/"+dataplay[0].count50+"/"+dataplay[0].countmiss+"]\nFecha: "+dataplay[0].date.slice(0,-9)+" Hora: "+dataplay[0].date.slice(11,-3))
                                .setThumbnail("https://b.ppy.sh/thumb/"+datamap[0].beatmapset_id+"l.jpg")
                            message.channel.send("**Recent Catch the Beat! Play for "+datauser[0].username+":**\n",exampleEmbed);
                            // Here we save the map information in a variable depending of the server so we can refer the map without putting its id and its independent of the server where is asked
                            if (message.channel.type != "dm"){
                                conn.query("SELECT * FROM map WHERE server = ?", [message.guild.id], (err, map) => {
                                    if (map.length>0){
                                        conn.query("UPDATE map SET mapa = ? WHERE server = ?", [datamap[0].beatmap_id, message.guild.id])
                                    }else{
                                        conn.query("INSERT INTO map (mapa, server) VALUES ('"+datamap[0].beatmap_id+"','"+message.guild.id+"')")
                                    }
                                })
                            }else{
                                conn.query("SELECT * FROM map WHERE server = ?", [message.author.id], (err, map) => {
                                    if (map.length>0){
                                        conn.query("UPDATE map SET mapa = ? WHERE server = ?", [datamap[0].beatmap_id, message.author.id])
                                    }else{
                                        conn.query("INSERT INTO map (mapa, server) VALUES ('"+datamap[0].beatmap_id+"','"+message.author.id+"')")
                                    }
                                })
                            }
                        }).catch(function(response){})
                    }).catch(function(response){
                        message.channel.send("No tiene plays recientes."); // This is a message error if the user doesn't have recent plays
                    })
                }).catch(function(response){})
            }
            // Here we get the profile name or id
            var u = comando[1]
            // If the user is asking for a profile by mentioning another user
            if (u!=undefined && u.startsWith("<@")){
                u = u.slice(2)
                u = u.slice(0, -1)
                conn.query("SELECT * FROM users WHERE id = ?",[u], (err, user) => {
                    if (user.length>0){
                        u = user[0].profile
                        recent(u)
                    }
                })
            // If the user is asking for a profile by writing the profile name or the osu id
            }else if (u!=undefined){
                recent(u)
            // If the user wants to see its own recent play so there is no user
            }else{
                conn.query("SELECT * FROM users WHERE id = ?",[message.author.id], (err, user) => {
                    if (user.length > 0){
                        u=user[0].profile
                        recent(u)
                    }else{
                        message.channel.send("Linkea tu cuenta por favor."); // If the user is not in the db
                    }
                })
            }
        }
        // If the command is 'score' it will read all the enough data to get a score in a named map or a before mentioned one
        if (comando[0] == "c" || comando[0] == "sc" || comando[0] == "score"){
            // This is a function that reads the user data, the map data and the score data to show it in a message, making 3 fetchs to the api
            function best(u,b){
                // This is for getting the score data
                fetch(api+"get_scores?k="+k+"&b="+b+"&u="+u+"&m=2")
                .then(function(response){
                    return response.json()
                }).then(function(dataplay){
                    // This is for getting the user data
                    fetch(api+"get_user?k="+k+"&u="+u+"&m=2")
                    .then(function(response){
                        return response.json()
                    }).then(function(datauser){
                        // This is for getting the map data
                        fetch(api+"get_beatmaps?k="+k+"&m=2&a=1&b="+b)
                        .then(function(response){
                            return response.json()
                        }).then(function(datamap){
                            sr = parseFloat(datamap[0].difficultyrating)
                            mods = parseInt(dataplay[0].enabled_mods)
                            mods = mods.toString(2).split("").reverse()
                            modstxt = ""
                            index = 0
                            // This is used to read the used mods in the play and put it in a text
                            mods.forEach(element => {
                                if (element != "0"){
                                    if (index==0){
                                        modstxt = modstxt.concat("NF")
                                    }
                                    if (index==1){
                                        modstxt = modstxt.concat("EZ")
                                    }
                                    if (index==3){
                                        modstxt = modstxt.concat("HD")
                                    }
                                    if (index==4){
                                        modstxt = modstxt.concat("HR")
                                    }
                                    if (index==5){
                                        modstxt = modstxt.concat("SD")
                                    }
                                    if (index==6){
                                        modstxt = modstxt.concat("DT")
                                    }
                                    if (index==8){
                                        modstxt = modstxt.concat("HT")
                                    }
                                    if (index==9){
                                        modstxt = modstxt.concat("NC")
                                    }
                                    if (index==10){
                                        modstxt = modstxt.concat("FL")
                                    }
                                    if (index==14){
                                        modstxt = modstxt.concat("PF")
                                    }
                                    if (index==29){
                                        modstxt = modstxt.concat("SV2")
                                    }
                                }
                                index++;
                            });
                            if (mods == 0){
                                modstxt ="NM"
                            }
                            // This is used for putting the score emojis (currently is using the server where is located, if you want to test this, put your own emojis for each score)
                            if (dataplay[0].rank == "XH"){
                                rank = "<:rankingXH:1028374879973683250>"
                            }else if (dataplay[0].rank == "X"){
                                rank = "<:rankingX:1028374894905413693>"
                            }else if (dataplay[0].rank == "SH"){
                                rank = "<:rankingSH:1028374905596682321>"
                            }else if (dataplay[0].rank == "S"){
                                rank = "<:rankingS:1028374918322208779>"
                            }else if (dataplay[0].rank == "A"){
                                rank = "<:rankingA:1028374929533571205>"
                            }else if (dataplay[0].rank == "B"){
                                rank = "<:rankingB:1028374941625753710>"
                            }else if (dataplay[0].rank == "C"){
                                rank = "<:rankingC:1028374952354795550>"
                            }else if (dataplay[0].rank == "D"){
                                rank = "<:rankingD:1028374963297726535>"
                            }else if (dataplay[0].rank == "F"){
                                rank = "<:xdd:1028374997481300029>"
                            }
                            // This is a calculus of the accuracy in the play
                            acc = (((parseInt(dataplay[0].count50)+parseInt(dataplay[0].count100)+parseInt(dataplay[0].count300))/(parseInt(dataplay[0].count50)+parseInt(dataplay[0].count100)+parseInt(dataplay[0].count300)+parseInt(dataplay[0].countmiss)+parseInt(dataplay[0].countkatu)))*100).toFixed(2)
                            linkplay = "https://osu.ppy.sh/beatmapsets/"+datamap[0].beatmapset_id+"#fruits/"+datamap[0].beatmap_id
                            // Here we recolect all information and send the final message
                            exampleEmbed = new discord.MessageEmbed()
                                .setColor(0x0099FF)
                                .setTitle("Best Catch the Beat! Play for "+datauser[0].username+" in")
                                .setURL('https://osu.ppy.sh/users/'+datauser[0].user_id)
                                .addField(datamap[0].title+" ["+datamap[0].version+"] + "+modstxt+" ["+sr.toFixed(2)+"★]", rank+"** - "+dataplay[0].pp+" pp -** Acc: "+acc+"% - Miss: "+dataplay[0].countmiss+", Dropmiss: "+dataplay[0].countkatu+"\n "+dataplay[0].score+" - "+dataplay[0].maxcombo+"/"+datamap[0].max_combo+" - ["+dataplay[0].count300+"/"+dataplay[0].count100+"/"+dataplay[0].count50+"/"+dataplay[0].countmiss+"]\nFecha: "+dataplay[0].date.slice(0,-9)+" Hora: "+dataplay[0].date.slice(11,-3)+"\n[Ver mapa]("+linkplay+")")
                                .setThumbnail("https://b.ppy.sh/thumb/"+datamap[0].beatmapset_id+"l.jpg")
                            message.channel.send(exampleEmbed);
                            // Here we save the map information in a variable depending of the server so we can refer the map without putting its id and its independent of the server where is asked
                            if (message.channel.type != "dm"){
                                conn.query("SELECT * FROM map WHERE server = ?", [message.guild.id], (err, map) => {
                                    if (map.length>0){
                                        conn.query("UPDATE map SET mapa = ? WHERE server = ?", [datamap[0].beatmap_id, message.guild.id])
                                    }else{
                                        conn.query("INSERT INTO map (mapa, server) VALUES ('"+datamap[0].beatmap_id+"','"+message.guild.id+"')")
                                    }
                                })
                            }else{
                                conn.query("SELECT * FROM map WHERE server = ?", [message.author.id], (err, map) => {
                                    if (map.length>0){
                                        conn.query("UPDATE map SET mapa = ? WHERE server = ?", [datamap[0].beatmap_id, message.author.id])
                                    }else{
                                        conn.query("INSERT INTO map (mapa, server) VALUES ('"+datamap[0].beatmap_id+"','"+message.author.id+"')")
                                    }
                                })
                            }
                        }).catch(function(response){
                            message.channel.send("No tiene plays en el map.") // This is a message error if the user doesn't have scores on the map
                        })
                    }).catch(function(response){})
                }).catch(function(response){})
            }
            // Here we saved the user and the map id
            var u = comando[1]
            var b = comando[2]
            // If the user is asking for a profile by writing the profile name and there is not a map id
            if(b==undefined && isNaN(u)==false && !u.startsWith("<@")){
                conn.query("SELECT * FROM users WHERE id = ?",[message.author.id], (err, user) => {
                    b = comando[1]
                    u=user[0].profile
                    best(u,b)
                })
            }
            // If the user wants to see its own score so there is no user and neither a map id
            if (u == undefined && b == undefined){
                conn.query("SELECT * FROM users WHERE id = ?",[message.author.id], (err, user) => {
                    if (user.length>0){
                        u=user[0].profile
                        if (message.channel.type!="dm"){
                            conn.query("SELECT * FROM map WHERE server = ?", [message.guild.id], (err,map) => {
                                if (map.length>0){
                                    b = map[0].mapa
                                    best(u,b)
                                }else{
                                    message.channel.send("Usa un ??rs primero por favor.")
                                }
                            })
                        }else{
                            conn.query("SELECT * FROM map WHERE server = ?", [message.author.id], (err,map) => {
                                if (map.length>0){
                                    b = map[0].mapa
                                    best(u,b)
                                }else{
                                    message.channel.send("Usa un ??rs primero por favor.")
                                }
                            })
                        }
                    }else{
                        message.channel.send("Linkea tu cuenta por favor."); // If the user is not in the db
                    }
                })
            }
            // If the user is asking for a profile by writing the osu id and there is not a map id
            if (b == undefined && u != undefined && isNaN(u)==true && !u.startsWith("<@")){
                if (message.channel.type!="dm"){
                    conn.query("SELECT * FROM map WHERE server = ?", [message.guild.id], (err,map) => {
                        if (map.length>0){
                            b = map[0].mapa
                            best(u,b)
                        }else{
                            message.channel.send("Usa un ??rs primero por favor.")
                        }
                    })
                }else{
                    conn.query("SELECT * FROM map WHERE server = ?", [message.author.id], (err,map) => {
                        if (map.length>0){
                            b = map[0].mapa
                            best(u,b)
                        }else{
                            message.channel.send("Usa un ??rs primero por favor.")
                        }
                    })
                }
            }
            // If the user is asking for a profile by mentioning another user and there is a map id
            if (u!=undefined && u.startsWith("<@")){
                u = u.slice(2)
                u = u.slice(0, -1)
                conn.query("SELECT * FROM users WHERE id = ?",[u], (err, user) => {
                    if (user.length>0){
                        u = user[0].profile
                        if (b==undefined){
                            if (message.channel.type!="dm"){
                                conn.query("SELECT * FROM map WHERE server = ?", [message.guild.id], (err,map) => {
                                    if (map.length>0){
                                        b = map[0].mapa
                                        best(u,b)
                                    }else{
                                        message.channel.send("Usa un ??rs primero por favor.")
                                    }
                                })
                            }else{
                                conn.query("SELECT * FROM map WHERE server = ?", [message.author.id], (err,map) => {
                                    if (map.length>0){
                                        b = map[0].mapa
                                        best(u,b)
                                    }else{
                                        message.channel.send("Usa un ??rs primero por favor.")
                                    }
                                })
                            }
                        }else{
                            best(u,b)
                        }
                    }
                })
            }
            // If the user is asking for a profile by writing the profile name or the osu id and there is a map id
            if (u!=undefined && isNaN(u)==true && b !=undefined){
                best(u,b)
            }
        }
        // If the command is 'top' the user will see a list of 5 plays of his top 100 plays depending of the page the user asks for
        if (comando[0] == "top"){
            // This is a function that reads the user data and the best user plays data to show it in a message, making 2 fetchs to the api
            function top(u){
                // This is for getting the user best plays data
                fetch(api+"get_user_best?k="+k+"&u="+u+"&m=2&limit=100")
                .then(function(response){
                    return response.json()
                }).then(function(dataplay){
                    // This is for getting the user data
                    fetch(api+"get_user?k="+k+"&u="+u+"&m=2")
                    .then(function(response){
                        return response.json()
                    }).then(async function(datauser){
                        // This is an async function that crop the list of best plays to show only the 5 one asked for the user
                        dataplayoriginal = dataplay.slice()
                        datos=[]
                        inicio=0
                        fin=5
                        // If the command is '-r' the top will be ordered by date
                        if (message.content.includes("-r")){
                            dataplay.sort((a,b) => new Date(b.date) - new Date(a.date))
                        }
                        // Here we filter depending of the number of the page asked
                        if (message.content.includes("-10")){
                            inicio = 5*9
                            fin = 5*10
                        }else if (message.content.includes("-11")){
                            inicio = 5*10
                            fin = 5*11
                        }else if (message.content.includes("-12")){
                            inicio = 5*11
                            fin = 5*12
                        }else if (message.content.includes("-13")){
                            inicio = 5*12
                            fin = 5*13
                        }else if (message.content.includes("-14")){
                            inicio = 5*13
                            fin = 5*14
                        }else if (message.content.includes("-15")){
                            inicio = 5*14
                            fin = 5*15
                        }else if (message.content.includes("-16")){
                            inicio = 5*15
                            fin = 5*16
                        }else if (message.content.includes("-17")){
                            inicio = 5*16
                            fin = 5*17
                        }else if (message.content.includes("-18")){
                            inicio = 5*17
                            fin = 5*18
                        }else if (message.content.includes("-19")){
                            inicio = 5*18
                            fin = 5*19
                        }else if (message.content.includes("-20")){
                            inicio = 5*19
                            fin = 5*20
                        }else if (message.content.includes("-2")){
                            inicio = 5*1
                            fin = 5*2
                        }else if (message.content.includes("-3")){
                            inicio = 5*2
                            fin = 5*3
                        }else if (message.content.includes("-4")){
                            inicio = 5*3
                            fin = 5*4
                        }else if (message.content.includes("-5")){
                            inicio = 5*4
                            fin = 5*5
                        }else if (message.content.includes("-6")){
                            inicio = 5*5
                            fin = 5*6
                        }else if (message.content.includes("-7")){
                            inicio = 5*6
                            fin = 5*7
                        }else if (message.content.includes("-8")){
                            inicio = 5*7
                            fin = 5*8
                        }else if (message.content.includes("-9")){
                            inicio = 5*8
                            fin = 5*9
                        }
                        for (i=inicio;i<fin;i++){
                            mods = parseInt(dataplay[i].enabled_mods)
                            mods = mods.toString(2).split("").reverse()
                            modstxt = ""
                            index = 0
                            // This is used to read the used mods in the play and put it in a text
                            mods.forEach(element => {
                                if (element != "0"){
                                    if (index==0){
                                        modstxt = modstxt.concat("NF")
                                    }
                                    if (index==1){
                                        modstxt = modstxt.concat("EZ")
                                    }
                                    if (index==3){
                                        modstxt = modstxt.concat("HD")
                                    }
                                    if (index==4){
                                        modstxt = modstxt.concat("HR")
                                    }
                                    if (index==5){
                                        modstxt = modstxt.concat("SD")
                                    }
                                    if (index==6){
                                        modstxt = modstxt.concat("DT")
                                    }
                                    if (index==8){
                                        modstxt = modstxt.concat("HT")
                                    }
                                    if (index==9){
                                        modstxt = modstxt.concat("NC")
                                    }
                                    if (index==10){
                                        modstxt = modstxt.concat("FL")
                                    }
                                    if (index==14){
                                        modstxt = modstxt.concat("PF")
                                    }
                                    if (index==29){
                                        modstxt = modstxt.concat("SV2")
                                    }
                                }
                                index++;
                            });
                            if (mods == 0){
                                modstxt ="NM"
                            }
                            // This is used for putting the score emojis (currently is using the server where is located, if you want to test this, put your own emojis for each score)
                            if (dataplay[i].rank == "XH"){
                                rank = "<:rankingXH:1028374879973683250>"
                            }else if (dataplay[i].rank == "X"){
                                rank = "<:rankingX:1028374894905413693>"
                            }else if (dataplay[i].rank == "SH"){
                                rank = "<:rankingSH:1028374905596682321>"
                            }else if (dataplay[i].rank == "S"){
                                rank = "<:rankingS:1028374918322208779>"
                            }else if (dataplay[i].rank == "A"){
                                rank = "<:rankingA:1028374929533571205>"
                            }else if (dataplay[i].rank == "B"){
                                rank = "<:rankingB:1028374941625753710>"
                            }else if (dataplay[i].rank == "C"){
                                rank = "<:rankingC:1028374952354795550>"
                            }else if (dataplay[i].rank == "D"){
                                rank = "<:rankingD:1028374963297726535>"
                            }else if (dataplay[i].rank == "F"){
                                rank = "<:xdd:1028374997481300029>"
                            }
                            // This is an async function that get every map data making a fetch for each one
                            const map= async (i) =>{
                                const b = fetch(api+"get_beatmaps?k="+k+"&m=2&a=1&b="+i)
                                .then(function(response){
                                    return response.json()
                                }).then(function(datamap){
                                    return datamap
                                }).catch(function(response){})
                                const printB = async () => {
                                    const c = await b;
                                    return b
                                }
                                return printB()
                            }
                            // This is used for putting the score emojis (currently is using the server where is located, if you want to test this, put your own emojis for each score)
                            acc = (((parseInt(dataplay[i].count50)+parseInt(dataplay[i].count100)+parseInt(dataplay[i].count300))/(parseInt(dataplay[i].count50)+parseInt(dataplay[i].count100)+parseInt(dataplay[i].count300)+parseInt(dataplay[i].countmiss)+parseInt(dataplay[i].countkatu)))*100).toFixed(2)
                            datamap=await map(dataplay[i].beatmap_id)
                            linkplay = "https://osu.ppy.sh/beatmapsets/"+datamap[0].beatmapset_id+"#fruits/"+datamap[0].beatmap_id
                            sr = parseFloat(datamap[0].difficultyrating)
                            txt=(dataplayoriginal.indexOf(dataplay[i])+1)+". "+datamap[0].title+" ["+datamap[0].version+"] + "+modstxt+" ["+sr.toFixed(2)+"★]"
                            datos.push(txt)
                            txt2=rank+"** - "+dataplay[i].pp+" pp -** Acc: "+acc+"% - Miss: "+dataplay[i].countmiss+", Dropmiss: "+dataplay[i].countkatu+"\n "+dataplay[i].score+" - "+dataplay[i].maxcombo+"/"+datamap[0].max_combo+" - ["+dataplay[i].count300+"/"+dataplay[i].count100+"/"+dataplay[i].count50+"/"+dataplay[i].countmiss+"]\nFecha: "+dataplay[i].date.slice(0,-9)+" Hora: "+dataplay[i].date.slice(11,-3)+"\n[Ver mapa]("+linkplay+")"
                            datos.push(txt2)
                            if (datos.length==10){
                                // Here we recolect all information and send the final message
                                exampleEmbed = new discord.MessageEmbed()
                                    .setColor(0x0099FF)
                                    .setTitle("Top Catch the Beat! Plays for "+datauser[0].username)
                                    .setURL('https://osu.ppy.sh/users/'+datauser[0].user_id)
                                    .addField(datos[0],datos[1])
                                    .addField(datos[2],datos[3])
                                    .addField(datos[4],datos[5])
                                    .addField(datos[6],datos[7])
                                    .addField(datos[8],datos[9])
                                    .setThumbnail('http://s.ppy.sh/a/'+datauser[0].user_id)
                                message.channel.send(exampleEmbed);
                            }
                        }
                    }).catch(function(response){})
                }).catch(function(response){})
            }
            // Here we crop the commands to read the asked profile
            var u = comando.filter((item) => item !== 'top' && item !== '-2' && item !== '-3' && item !== '-4' && item !== '-5' && item !== '-6' && item !== '-7' && item !== '-8' && item !== '-9' && item !== '-10' && item !== '-11' && item !== '-12' && item !== '-13' && item !== '-14' && item !== '-15' && item !== '-16' && item !== '-17' && item !== '-18' && item !== '-19' && item !== '-20' && item !== '-r').join(" ")
            // If the user is asking for a profile by mentioning another user
            if (u.length>0 && u.startsWith("<@")){
                u = u.slice(2)
                u = u.slice(0, -1)
                conn.query("SELECT * FROM users WHERE id = ?",[u], (err, user) => {
                    if (user.length>0){
                        u = user[0].profile
                        top(u)
                    }
                })
            // If the user is asking for a profile by writing the profile name or the osu id
            }else if (u.length>0){
                top(u)
            // If the user wants to see its own profile so there is no user
            }else{
                conn.query("SELECT * FROM users WHERE id = ?",[message.author.id], (err, user) => {
                    if (user.length>0){
                        u = user[0].profile
                        top(u)
                    }else{
                        message.channel.send("Linkea tu cuenta por favor."); // If the user is not in the db
                    }
                })
            }
        }
        // If the command is 'setprofile' saves in the database the profile name or osu id an connects it to the discord profile
        if (comando[0] == "setprofile"){
            // Here we crop the command to read the profile
            var profile = comando.filter((item) => item !== 'setprofile').join(" ")
            if (profile!=undefined){
                conn.query("SELECT * FROM users WHERE id = ?",[message.author.id], (err, users) => {
                    // If the discord user didn't exist in the db
                    if (users.length==0){
                        conn.query("INSERT INTO users (id, profile) VALUES ('"+message.author.id+"','"+profile+"')")
                        message.channel.send("Agregado correctamente :3");
                    // If the discord user is updating his profile
                    }else{
                        conn.query("UPDATE users SET profile = ? WHERE id = ?", [profile,message.author.id])
                        message.channel.send("Actualizado correctamente :3");
                    }
                })
            }
        }
    // Here detects if the message contains an osu map link to read it and show the map information
    }else if (message.content.toLowerCase().includes("https://osu.ppy.sh/beatmapsets/")){
        mensaje = message.content.slice(31)
        if (mensaje.length>0 && mensaje.includes("#fruits")){
            mensaje_2 = mensaje
        }
        while (mensaje.includes("#")){
            mensaje = mensaje.slice(0,-1)
        }
        if (isNaN(mensaje_2.slice(mensaje_2.length-1)) == false){
            while (isNaN(mensaje_2)==true){
                mensaje_2 = mensaje_2.slice(1)
            }
            // Here we get the map data
            fetch(api+"get_beatmaps?k="+k+"&m=2&a=1&b="+mensaje_2)
            .then(function(response){
                return response.json()
            }).then(function(datamap){
                data = datamap[0]
                // Here we use the map data gotten by the api
                if (data.approved == "-2"){
                    rank = "Graveyard"
                }else if (data.approved == "-1"){
                    rank = "Wip"
                }else if (data.approved == "0"){
                    rank = "Pending"
                }else if (data.approved == "1"){
                    rank = "Ranked"
                }else if (data.approved == "2"){
                    rank = "Approved"
                }else if (data.approved == "3"){
                    rank = "Qualified"
                }else if (data.approved == "4"){
                    rank = "Loved"
                }
                time = (Math.trunc(parseInt(data.hit_length)/60))+":"+(parseInt(data.hit_length)%60)
                sr = parseFloat(data.difficultyrating).toFixed(2)
                // Here we recolect all information and send the final message
                exampleEmbed = new discord.MessageEmbed()
                    .setColor(0x0099FF)
                    .setTitle(data.artist+" - "+data.title+" by "+data.creator)
                    .setURL("https://osu.ppy.sh/beatmapsets/"+mensaje+"#fruits/"+mensaje_2)
                    .addField("**Length:** "+time+" **BPM:** "+data.bpm+" \n "+data.version,"**SR:** "+sr+"★  **Max Combo:** x"+data.max_combo+" \n **AR:** "+data.diff_approach+"  **OD:** "+data.diff_overall+"  **HP:** "+data.diff_drain+"  **CS:** "+data.diff_size+" \n **PP:** noc bro")
                    .setThumbnail("https://b.ppy.sh/thumb/"+mensaje+"l.jpg")
                    .setFooter(rank+" | "+data.favourite_count+"❤︎")
                message.channel.send(exampleEmbed);
            }).catch(function(datamap){})
        }
    }
})

// Here we use the bot token to connect it (I won't put it since is private if you want to test it put yours)
client.login(config.BOT_TOKEN);