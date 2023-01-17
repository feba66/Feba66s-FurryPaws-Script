// ==UserScript==
// @name         Feba66's Script
// @namespace    http://tampermonkey.net/
// @version      1.7.1
// @description  Collect loads of information
// @author       feba66 aka fp: Felix#1631601 aka dc: feba66lap#7402
// @downloadURL  https://github.com/feba66/Feba66s-FurryPaws-Script/raw/main/febas_network_script.user.js
// @updateURL    https://github.com/feba66/Feba66s-FurryPaws-Script/raw/main/febas_network_script.meta.js
// @match        https://www.furry-paws.com/kennel/overview
// @match        https://www.furry-paws.com/dog/index/*
// @match        https://www.furry-paws.com/dog/refill_water/*
// @match        https://www.furry-paws.com/dog/refill_food/*
// @match        https://www.furry-paws.com/dog/play/*
// @match        https://www.furry-paws.com/dog/clean/*
// @match        https://www.furry-paws.com/dog/groom/*
// @match        https://www.furry-paws.com/dog/train/*
// @icon         https://www.google.com/s2/favicons?domain=furry-paws.com
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    //config
    let serverUrl = "wss://wss.feba66.de";
    let enableServerConnection = true;
    let connectionSettleTime = 500;
    let connectionMaxTries = 10;

    //dont touch after here
    if (enableServerConnection) {
        var ws = new WebSocket(serverUrl)
        ws.onopen = function (e) {
            console.log("Connected successfully to " + serverUrl)
        }
    }
    //Structs
    const msgType = {
        dog: "dogv2",
        night: "nightv2",
        train: "trainv2",
        lvlup: "lvlupv2"
    }
    class Message {
        constructor(type, data, sender) {
            this.type = type,
                this.data = data,
                this.sender = sender;
        }
    }

    const KennelDog = {
        id: -1,
        name: "",
        genes: "",
        breed: "",
        gender: "",
        generation: -1,
        aptitude: "",
        dad: -1,
        mom: -1,
        owner: -1,
        age: -1
    }
    const eventLog = {
        id: -1,
        datetime: 0,
        aptitude: undefined,
        event: 0,//0 none, 1 focused, -1 unfocused
        title: ""
    }

    //funcs
    function getPlayer() {
        try {
            let c = document.getElementById("fpaw_layout_column_3").children;
            for (let i = 0; i < c.length; i++) {
                if (c[i].className == "column_section centered" && c[i].innerHTML.indexOf("href") != -1) {
                    let i1 = c[i].innerHTML.indexOf("owner/") + 6;
                    let i2 = c[i].innerHTML.indexOf("</a>");
                    let player = parseInt(c[i].innerHTML.substring(i1, i2).split("\">")[0]);
                    console.log(player)
                    return player;
                }
            }
        } catch (error) {
            console.log(error)
        }
        return -1
    }
    function sendMessage(msg, tries = 0) {
        if (tries <= connectionMaxTries) {
            setTimeout(function () {
                if (ws.readyState != 1) {
                    sendMessage(msg, tries + 1)
                }
                else {
                    ws.send(msg)
                }
            }, connectionSettleTime)
        }
    }
    function msgV2(type, data) {
        sendMessage(JSON.stringify(new Message(type, data, getPlayer())))
    }
    //code
    let dogs = JSON.parse(localStorage.getItem("feba_dogs"));
    if (dogs == null) {
        dogs = {};
    }

    let url = window.location.pathname;
    console.log(url);

    if (url.startsWith("/dog/")) {

        let id = url.split("/")[3];
        //console.log(dogs[id]);

        var target = document.querySelector('#dog_response');
        var observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                mutation.addedNodes.forEach(n => {
                    if (n.className == "notice") {
                        let dogName = document.getElementsByClassName("info_table")[0].children[0].children[0].childNodes[1].textContent.replace("  ", " ").replace(" (Change)", "");
                        let text = n.innerText.replaceAll(dogName, "[NAME]");
                        //console.log(text)
                        let split = text.split(/[.!]+/g);
                        //water
                        if (text.indexOf("water bowl has been refilled") != -1 || text.indexOf("water bowl is already filled to the brim") != -1) { }
                        //food
                        else if (text.indexOf("You give a serving of") != -1) { }
                        //play
                        else if (text.indexOf("happily returns the toy to you.") != -1) { }
                        //clean
                        else if (text.indexOf("kennel has been cleaned.") != -1) { }
                        //groom
                        else if (text.indexOf("Shiny and soft, your dog's coat is now in perfect condition!") != -1) { }
                        //compete
                        else if (text.indexOf("The competition results will be posted tomorrow!") != -1) {
                            let ev = -2;
                            if (text.indexOf("completely focused today") != -1) {
                                console.log("focused night!")
                                ev = 1;
                            }
                            else if (text.indexOf("lacks focus today") != -1) {
                                console.log("unfocused night!")
                                ev = -1;
                            }
                            else {
                                console.log("normal night!");
                                ev = 0;
                            }

                            let comp = text.split("entered in")[1];
                            comp = comp.substring(1, comp.indexOf(" competitions."))
                            comp = comp.substring(comp.indexOf(" ") + 1)
                            comp = comp.substring(0, comp.lastIndexOf(" "))
                            //stupid way of fixing the titles
                            let sport = comp.replace(" Hunting", "").replace(" Musical", "").replace(" Field", "").replace(" Dock", "").replace(" Earthdog", "").replace(" Scent", "").replace(" Water", "")
                            let eventlog = Object.create(eventLog);
                            eventlog.id = id;
                            eventlog.datetime = Date.now()
                            eventlog.event = ev;
                            eventlog.title = sport;
                            let eventLogs = JSON.parse(localStorage.getItem("feba_eventlog"));
                            if (eventLogs == null) {
                                eventLogs = [];
                            }
                            eventLogs.push(eventlog);
                            console.log(eventlog);
                            localStorage.setItem("feba_eventlog", JSON.stringify(eventLogs));
                            if (enableServerConnection) {
                                msgV2(msgType.night, eventlog)
                            }
                        }
                        //lvlup
                        else if (text.indexOf("has gone from Level") != -1) {
                            let lvlup = { "did": parseInt(id), "datetime": Date.now(), "age": document.getElementsByClassName("info_table")[0].children[0].children[10].childNodes[1].textContent.split(" ")[0], "agi": 0, "cha": 0, "int": 0, "spd": 0, "stm": 0, "str": 0, "uxp": 0, "lvl": 0, "bonus": 0 };
                            split.forEach(element => {
                                let indx = element.indexOf("gained");
                                if (indx != -1) {
                                    let arr = element.substring(indx).split(" ");
                                    arr[1] = arr[1].replace("+", "");
                                    switch (arr[2]) {
                                        case "agility":
                                            lvlup["agi"] = arr[1]
                                            break;
                                        case "charisma":
                                            lvlup["cha"] = arr[1]
                                            break;
                                        case "intelligence":
                                            lvlup["int"] = arr[1]
                                            break;
                                        case "speed":
                                            lvlup["spd"] = arr[1]
                                            break;
                                        case "stamina":
                                            lvlup["stm"] = arr[1]
                                            break;
                                        case "strength":
                                            lvlup["str"] = arr[1]
                                            break;
                                        case "UXP":
                                        case "Fame":
                                            lvlup["uxp"] = arr[1]
                                            break;
                                        default:
                                            console.log("ERROR:")
                                            console.log(element)
                                            console.log(arr)
                                            break;
                                    }
                                }
                                else {
                                    indx = element.indexOf("to Level");
                                    if (indx != -1) {
                                        lvlup["lvl"] = element.substring(indx).split(" ")[2];
                                        console.log(element)
                                        console.log(lvlup["lvl"]);
                                    }
                                    else {
                                        indx = element.indexOf("bonus")
                                        if (indx != -1) {
                                            lvlup["bonus"] = element.substring(indx).split(" ")[2].replace("$", "").replace(",", "")
                                        }
                                    }
                                }
                            });
                            let lvlupEvents = JSON.parse(localStorage.getItem("feba_lvlupEvents"));
                            if (lvlupEvents == null) {
                                lvlupEvents = [];
                            }
                            console.log(lvlup);
                            lvlupEvents.push(lvlup)
                            localStorage.setItem("feba_lvlupEvents", JSON.stringify(lvlupEvents));
                            if (enableServerConnection) {
                                msgV2(msgType.lvlup, lvlup)
                            }
                        }
                        //train
                        else if (text.indexOf("gained ") != -1) {
                            let training = {
                                "did": id,"datetime": Date.now(), "lvl": document.getElementsByClassName("var_level")[0].innerText,
                                "agi":  0, "cha":  0, "int":  0, "spd":  0, "stm":  0, "str":  0, 
                                "agi2": 0, "cha2": 0, "int2": 0, "spd2": 0, "stm2": 0, "str2": 0, 
                                "train": 0, "double": 0
                            };
                            let i = 0, j = 0;
                            split.forEach(element => {
                                let oname = "";
                                let arr = []
                                let indx = element.indexOf("gained");
                                let boo=false
                                if (indx != -1) {
                                    arr = element.substring(indx).split(" ");
                                    arr[1] = arr[1].replace("+", "");
                                    switch (arr[2]) {
                                        case "Speed":
                                            oname = "spd";
                                            boo = true;
                                            break;
                                        case "Stamina":
                                            oname = "stm";
                                            boo = true;
                                            break;
                                        case "Strength":
                                            oname = "str";
                                            boo = true;
                                            break;
                                        case "Agility":
                                            oname = "agi";
                                            boo = true;
                                            break;
                                        case "Charisma":
                                            oname = "cha";
                                            boo = true;
                                            break;
                                        case "Intelligence":
                                            oname = "int";
                                            boo = true;
                                            break;
                                        case "Training":
                                            oname = "train";
                                            break;
                                        default:
                                            console.log("ERROR:")
                                            console.log(element)
                                            console.log(arr)
                                            break;
                                    }
                                    if(boo){
                                        if (j==0){
                                            j=1;
                                        }
                                        else{
                                            j=3
                                        }
                                    }
                                    if (j > 1) {
                                        training[oname + "2"] = arr[1];
                                    } else {
                                        training[oname] = arr[1];
                                    }
                                }
                                else if (element.indexOf("twice as effective") != -1) {
                                    arr[1] = "double";
                                    training["double"] += 2*(1+j);
                                }

                                i++;
                            });
                            let trainingEvents = JSON.parse(localStorage.getItem("feba_trainingEvents"));
                            if (trainingEvents == null) {
                                trainingEvents = [];
                            }
                            console.log(training);
                            trainingEvents.push(training)
                            localStorage.setItem("feba_trainingEvents", JSON.stringify(trainingEvents));
                            if (enableServerConnection) {
                                msgV2(msgType.train, training)
                            }
                        }
                    }
                });
            });
        });
        var config = { attributes: false, childList: true, characterData: false };
        observer.observe(target, config);

        var infotable = document.getElementsByClassName("info_table")[0].children[0]
        if (dogs[id] == undefined || true) {
            let dog = Object.create(KennelDog);
            dog.id = id;//

            dog.genes = infotable.children[16].childNodes[1].textContent.split(" ");//
            dog.fullName = infotable.children[0].childNodes[1].textContent.replace(" (Change)", "").replaceAll(";", "_:");//
            dog.breed = infotable.children[6].childNodes[1].textContent.replace("Registered ", "");//
            dog.gender = infotable.children[7].childNodes[1].textContent;//
            dog.owner = infotable.children[11].childNodes[1].textContent.split("#")[1].replace(")", "");//
            dog.age = infotable.children[10].childNodes[1].textContent.split(" ")[0];//
            dog.generation = infotable.children[13].childNodes[1].textContent;//
            dog.aptitude = infotable.children[17].childNodes[1].textContent.split(", ");//

            if (dog.generation > 1) {
                var tab_history = document.getElementById("tab_history").children[1]
                dog.dad = tab_history.children[0].children[3].children[0].children[0].childNodes[1].textContent.split("#")[1];//
                dog.mom = tab_history.children[1].children[3].children[0].children[0].childNodes[1].textContent.split("#")[1];//
            }
            else {
                dog.dad = -1
                dog.mom = -1
            }

            console.log(dog)
            if (enableServerConnection && url.startsWith("/dog/index/")) {
                msgV2(msgType.dog, dog)
            }

            let name = "|" + dog.genes[14]
            for (let i = dog.genes[14].length; i < 4; i++) {
                name += "-";
            }
            let HH = 0, Hh = 0, hh = 0;
            dog.genes.forEach(e => {
                switch (e) {
                    case "HH":
                        HH++;
                        break;
                    case "Hh":
                        Hh++;
                        break;
                    case "hh":
                        hh++;
                        break;
                    default:
                        break;
                }
            })
            //name += "|"+HH+"|"+Hh+"|"+hh
            var hquality = Math.round((HH / 24.0 + Hh / 24.0 * 0.66) * 100) / 100.0
            name += "|" + hquality

            let a = dog.genes[15];
            let b = dog.genes[16];
            name += "|" + a + "|" + b;

            console.log(name)
            dogs[dog.id] = dog;
        }
    }

    if (url.startsWith("/kennel/overview")) {
        let s = "";
        for (const keyy in dogs) {
            if (Object.hasOwnProperty.call(dogs, keyy)) {
                const e = dogs[keyy];
                s += e.id + ";" + e.generation + ";" + e.gender + ";" + e.fullName + ";" + e.breed + ";" + e.genes.join(";") + ";" + e.aptitude.join(";") + "\n";
            }
        }
        let eventLogs = JSON.parse(localStorage.getItem("feba_eventlog"));
        if (eventLogs == null) {
            eventLogs = [];
        }
        //console.log(eventLogs);
        let lvlupEvents = JSON.parse(localStorage.getItem("feba_lvlupEvents"));
        if (lvlupEvents == null) {
            lvlupEvents = {};
        }
        let trainingEvents = JSON.parse(localStorage.getItem("feba_trainingEvents"));
        if (trainingEvents == null) {
            trainingEvents = {};
        }
        let st = "";
        for (let i = 0; i < eventLogs.length; i++) {
            st += eventLogs[i].id + ";" + eventLogs[i].datetime + ";" + eventLogs[i].event + ";"
            if (eventLogs[i].title != undefined) {
                st += eventLogs[i].title;
            }
            st += "\n";
        }
        console.log("eventLogs");
        console.log(st);
        st = "";
        for (let i = 0; i < lvlupEvents.length; i++) {
            st += lvlupEvents[i].did + ";" + lvlupEvents[i].datetime + ";" + lvlupEvents[i].agi + ";" + lvlupEvents[i].cha + ";" + lvlupEvents[i].int + ";" + lvlupEvents[i].spd + ";" + lvlupEvents[i].stm + ";" + lvlupEvents[i].str + ";" + lvlupEvents[i].uxp + ";" + (lvlupEvents[i].lvl || "") + ";" + (lvlupEvents[i].bonus || "") + ";"
            st += "\n";
        }
        console.log("lvlupEvents");
        console.log(st);
        console.log("dogs");
        console.log(dogs);
        console.log("dog csv");
        console.log(s);
        console.log("dogs that are not 100% taken care off:");
        var infotable = document.getElementsByClassName("info_table")[0].children[0]
        let tr = infotable.children
        for (let t of tr) {
            if (t.innerHTML.indexOf("bullet_red") != -1 || t.innerHTML.indexOf("bullet_orange") != -1)
                console.log(t.children[0].innerText)
        }
    }
    localStorage.setItem("feba_dogs", JSON.stringify(dogs));

})();
