// ==UserScript==
// @name         Feba66's Script
// @namespace    http://tampermonkey.net/
// @version      1
// @description  Collect loads of information
// @author       feba66 aka fp: Felix#1631601 aka dc: feba66lap#7402
// @match        https://www.furry-paws.com/kennel/overview
// @match        https://www.furry-paws.com/dog/index/*
// @icon         https://www.google.com/s2/favicons?domain=furry-paws.com
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
    //Structs
    const KennelDog = {
        id: -1,
        name: "",
        genes: "",
        breed: "",
        gender: "",
        generation: -1,
        aptitude: "",
        dad: -1,
        mom: -1
    }
    const eventLog = {
        id: -1,
        datetime: 0,
        aptitude: undefined,
        event: 0,//0 none, 1 focused, -1 unfocused
        title: ""
    }

    function punSquare(a, b) {
        let possibles = [];
        for (let i = 0; i < a.length; i++) {
            const aa = a[i];
            for (let j = 0; j < b.length; j++) {
                const bb = b[j];
                possibles.push([aa, bb].sort().join(""));
            }
        }
        let cnt = {};
        for (let i = 0; i < possibles.length; i++) {
            const p = possibles[i];
            if (cnt[p] == undefined) {
                cnt[p] = 1;
            }
            else
                cnt[p]++;
        }
        if (cnt["HH"] != undefined) {
            return "HH"
        } else if (cnt["Hh"] != undefined) {
            return "Hh"
        } else if (cnt["hh"] != undefined)
            return "hh";

        if (cnt["lala"] != undefined) {
            return "lala"
        } else if (cnt["Lla"] != undefined) {
            return "Lla"
        } else if (cnt["LL"] != undefined) {
            return "LL"
        } else if (cnt["lla"] != undefined) {
            return "lla"
        } else if (cnt["ll"] != undefined) {
            return "ll";
        } else if (cnt["Ll"] != undefined)
            return "Ll";


        let tmp = 0;
        let good = 0;
        for (const k in cnt) {
            tmp += 2;
            for (let i = 0; i < [k.substring(0, 3), k.substring(3, 6)].length; i++) {
                const k2 = [k.substring(0, 3), k.substring(3, 6)][i];
                if (k2.indexOf("agi") != -1)
                    good++;
                if (k2.indexOf("cha") != -1)
                    good++;
                if (k2.indexOf("stm") != -1)
                    good++;
            }

        }
        return good / tmp;
    }
    function geneSplit(gene) {
        switch (gene) {
            case "Lla":
                return ["L", "la"];
            case "lla":
                return ["l", "la"];
            case "lala":
                return ["la", "la"];
            default:
                if (gene.length == 2)
                    return [gene.substring(0, 1), gene.substring(1, 2)]
                else if (gene.length == 6)
                    return [gene.substring(0, 3), gene.substring(3, 6)]
                else
                    debugger;
        }
    }

    let dogs = JSON.parse(localStorage.getItem("feba_dogs"));
    if (dogs == null) {
        dogs = {};
    }



    let url = window.location.pathname;
    console.log(url);
    
    if (url.startsWith("/dog/index/")) {

        let id = url.split("/")[3];
        //console.log(dogs[id]);

        var target = document.querySelector('#dog_response');
        var observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                console.log(mutation.type);
                console.log(mutation);
                mutation.addedNodes.forEach(n => {
                    if (n.className == "notice") {
                        console.log("notice");
                        let split = n.innerText.split(/[.!]+/g);
                        let ev = -1;
                        let correct = false;

                        //dog trained
                        if (n.innerText.indexOf("lost") != -1 && n.innerText.indexOf("Energy") != -1) {
                            
                            let training = { "did": id, "lvl": document.getElementsByClassName("var_level")[0].innerText };
                            let i = 0;
                            split.forEach(element => {
                                let oname = "";
                                let arr = []
                                let indx = element.indexOf("gained");
                                if (indx != -1) {
                                    arr = element.substring(indx).split(" ");
                                    arr[1] = arr[1].replace("+", "");
                                    switch (arr[2]) {
                                        case "Speed":
                                            oname = "spd";
                                            break;
                                        case "Stamina":
                                            oname = "stm";
                                            break;
                                        case "Strength":
                                            oname = "str";
                                            break;
                                        case "Agility":
                                            oname = "agi";
                                            break;
                                        case "Charisma":
                                            oname = "cha";
                                            break;
                                        case "Intelligence":
                                            oname = "int";
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
                                }
                                else if (element.indexOf("twice as effective") != -1) {
                                    arr[1] = "double"
                                }
                                training[i + "-" + oname] = arr[1];
                                i++;
                            });
                            let trainingEvents = JSON.parse(localStorage.getItem("feba_trainingEvents"));
                            if (trainingEvents == null) {
                                trainingEvents = [];
                            }
                            training["datetime"] = Date.now();
                            console.log(training);
                            trainingEvents.push(training)
                            localStorage.setItem("feba_trainingEvents", JSON.stringify(trainingEvents));
                        }
                        // dog leveled up
                        else if (n.innerText.indexOf("has gone from Level") != -1) {
                            let lvlup = { "did": id };
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
                            lvlup["datetime"] = Date.now();
                            console.log(lvlup);
                            lvlupEvents.push(lvlup)
                            localStorage.setItem("feba_lvlupEvents", JSON.stringify(lvlupEvents));
                        }
                        
                        if (split.length == 4) {
                            if (split[0].indexOf("entered in") != -1) {
                                console.log("normal night!");
                                correct = true;
                                ev = 0;
                            }
                        }
                        else if (split.length == 5) {
                            if (split[1].indexOf("completely focused today") != -1) {
                                console.log("focused night!")
                                correct = true;
                                ev = 1;
                            }
                            else if (split[1].indexOf("lacks focus today") != -1) {
                                console.log("unfocused night!")
                                correct = true;
                                ev = -1;
                            }
                        }
                        console.log(split);
                        if (correct) {
                            let comp = split[0].split("entered in")[1];
                            let indx = 0;
                            if (comp.indexOf(" ") == 0) {
                                indx = comp.indexOf(" ", comp.indexOf(" ") + 1) + 1
                            }
                            else
                                indx = comp.indexOf(" ");
                            comp = comp.substring(indx)
                            let tmp = comp.split(" ");
                            let sport = comp.substring(0, comp.indexOf(tmp[tmp.length - 2]) - 1)
                            console.log(sport);
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
                            console.log(eventLogs);
                            localStorage.setItem("feba_eventlog", JSON.stringify(eventLogs));
                        }
                    }
                });
            });
        });
        var config = { attributes: false, childList: true, characterData: false };
        observer.observe(target, config);



        if (dogs[id] == undefined || true) {
            let dog = Object.create(KennelDog);
            dog.id = id;
            dog.genes = document.getElementsByClassName("info_table")[0].children[0].children[16].childNodes[1].textContent.split(" ");
            dog.fullName = document.getElementsByClassName("info_table")[0].children[0].children[0].childNodes[1].textContent.replace(" (Change)", "");
            dog.breed = document.getElementsByClassName("info_table")[0].children[0].children[6].childNodes[1].textContent;
            dog.gender = document.getElementsByClassName("info_table")[0].children[0].children[7].childNodes[1].textContent;
            dog.generation = document.getElementsByClassName("info_table")[0].children[0].children[13].childNodes[1].textContent;
            dog.aptitude = document.getElementsByClassName("info_table")[0].children[0].children[17].childNodes[1].textContent.split(", ");

            if (dog.generation > 1) {
                dog.dad = document.getElementById("tab_history").children[1].children[0].children[3].children[0].children[0].childNodes[1].textContent.split("#")[1];
                dog.mom = document.getElementById("tab_history").children[1].children[1].children[3].children[0].children[0].childNodes[1].textContent.split("#")[1];
            }

            console.log(dog)
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
            name+="|"+hquality

            let a = dog.genes[15];
            let b = dog.genes[16];
            name += "|" + a+"|" + b;
            

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
        console.log(st);/*
        st = "";
        for (let i = 0; i < eventLogs.length; i++) {
            st+= eventLogs[i].id+";"+eventLogs[i].datetime+";"+eventLogs[i].event+";"
            if (eventLogs[i].title!=undefined) {
                st+=eventLogs[i].title.replace(" Hunting","").replace(" Musical","");
            }
            st+="\n";
        }
        console.log(st);*/
        console.log("dogs");
        console.log(dogs);
        console.log("dog csv");
        console.log(s);

        console.log("dogs that are not 100% taken care off:");
        let tr = document.getElementsByClassName("info_table")[0].children[0].children
        for (let t of tr) {
            if (t.innerHTML.indexOf("bullet_red") != -1 || t.innerHTML.indexOf("bullet_orange") != -1)
                console.log(t.children[0].innerText)
        }
    }
    localStorage.setItem("feba_dogs", JSON.stringify(dogs));

})();
