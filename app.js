`if you're reading this, congratulations.
this hack was open source for a while back in 2015, and then was obfuscated after due to some naughty people attempting to skid
now here's v2 of this hack which literally will have 0 obfuscation in the client script due to it literally having nothing juicy, unless you want to attempt to pass malformed data to my server? lol
keep in mind this is basically a copypasta of code made in 2016, cleaned up in 2017 and refactored in 2019... i miss 2016.
i'm probably gonna consider leaving a free premium key for people that look at this, that's *if* i implement a premium. else, you can just donate me at paypal.me/mem1337 because i put in like 40 hours of work into v2
anyways, get ready for trash, because all the important logic is impl serverside! :omegalul:
sorry for the retards who can only understand code made with React/Angular... this is pure javascript + jquery :sunglasses:
also don't get mad at me for putting this as a string instead of comments, you wouldn't've seen this message otherwise bc cloudflare cache
`

var alerts = [];
var bots = [];
var botCount = 0;
var nav = ["bots", "win", "vip"];
var ws;
var secretCode;
var gameId;
var bo;
var adsplaced = false;

var hackop = {
	HANDSHAKE: 0,
	REAUTH: 1,
	VERSION: 2,
	BOTNEW: 3,
	BOTUPD: 4,
	BOTSTAT: 5,
	BOTINFO: 6,
	CHKGAME: 7,
	PING: 8
};
var botstates = {
	CONNECTED: 0,
	DISCONNECT: 1,
	LOGGINGIN: 2,
	BADGAME: 3,
	ERRCONN: 4,
	KICKED: 5,
	BADNAME: 6
};
var stateInfo = [
{ //CONNECTED
	message: "Connected",
	type: "success"
},
{ //DISCONNECT
	message: "Disconnected",
	type: "danger"
},
{ //LOGGINGIN
	message: "Logging in",
	type: "info"
},
{ //BADGAME
	message: "Bad Game Pin",
	type: "danger"
},
{ //ERRCONN
	message: "Error Connecting",
	type: "danger"
},
{ //KICKED
	message: "Kicked",
	type: "danger"
},
{ //BADNAME
	message: "Duplicate Name",
	type: "danger"
}
];

var i32s = function(x){
	return String.fromCharCode.apply(null, new Uint8Array([
		 (x & 0xff000000) >> 24,
		 (x & 0x00ff0000) >> 16,
		 (x & 0x0000ff00) >> 8,
		 (x & 0x000000ff)
	]));
}
var s32i = function(x){
	return (x[0] << 24) + (x[1] << 16) + (x[2] << 8) + x[3] >>> 0
}

//oh- i don't even wanna talk about this
function updateAlerts(){
    if(alerts.length == 0){
		$("#alert").hide(1000);
    }else{
		als = alerts[0];
		alerts.forEach(function(a, i){
			if(i != 0){
				als += " | "+a;
			}
		});
		if($("#alert").html() !== als){ 
			$("#alert").html(als);
			$("#alert").css("display", "block");
		}
	}
}
function al(msg){
    alerts.push(msg);
	updateAlerts();
    setTimeout(function() {
		alerts.pop(msg);
		updateAlerts();
    }, 5000);
}

function sendPacket(op, data, noAlert){
	data = data || "";
	noAlert = noAlert || false;
	if(ws.readyState != WebSocket.OPEN){
		if(!noAlert) 
			al("Can't execute action because not connected to server!");
		return;
	}
	var ok = new Uint8Array(data.toString().length+1);
	ok[0] = op;
	for(var i = 0; i < data.length; i++){
		ok[i+1] = data.charCodeAt(i);
	}
	ws.send(ok);
}

function connect(){
	ws = new WebSocket("wss://kahoot.mem.rip:8443");
	ws.binaryType = "arraybuffer";
	ws.onmessage = onMessage;
	ws.onclose = onClose;
}

function onMessage(e){
	var data = new Uint8Array(e.data);
	switch(data[0]){
		case hackop.HANDSHAKE:
			secretCode = String.fromCharCode.apply(null, data.slice(1));
			break;
		case hackop.REAUTH:
			if(data[1]){
				al("Reauthenticated with server!");
			}else{
				al("We were unable to restore your session. Your bots have been disconnected.");
				sendPacket(hackop.HANDSHAKE);
				bots = [];
				botCount = 0;
				updateBots();
			}
			break;
		case hackop.VERSION:
			$("#srverr").css("display", "none");
			al("Connected to server (v"+(String.fromCharCode.apply(null, data.slice(1)))+")");
			if(secretCode)
				sendPacket(hackop.REAUTH, secretCode);
			else
				sendPacket(hackop.HANDSHAKE);
			break;
		case hackop.BOTUPD:
			bots[s32i(data.slice(1,5))].username = String.fromCharCode.apply(null, data.slice(5));
			updateBots();
			break;
		case hackop.BOTSTAT:
			bots[s32i(data.slice(1,5))].status = data[5];
			updateBots();
			break;
		case hackop.BOTINFO:
			var bot = bots[s32i(data.slice(1,5))];
			bot.place = s32i(data.slice(5,9));
			bot.score = s32i(data.slice(9,13));
			updateBots();
			break;
		case hackop.CHKGAME:
			if(data[5] == 0){
				al("Connected to game!");
				gameId = s32i(data.slice(1,5));
				$("#gameid").html(gameId);
			}else{
				al("Can't connect to game: " + (data[5] == 3 ? "Invalid game pin" : "Can't connect to kahoot"));
			}
			break;
		default:
			console.log("onMessage unhandled opcode ("+(data[0])+")");
			break;
	}
}

function onClose(e){
	if(e.code == 1000){
		$("#srverr").css("display", "block");
		$("#err").html("You've been kicked: "+e.reason+"<br>Please click <a href='javascript:reconncb()'>here</a> to reconnect.");
	}else{
		$("#srverr").css("display", "block");
		$("#err").html("Disconnected! We're attempting to reconnect you.");
		setTimeout(connect, 2000);
	}
}

function reconncb(){
	$("#srverr").css("display", "block");
	$("#err").html("We're attempting to reconnect you.");
	connect();
}

function createBot(username, autoplay){
	var lol = botCount++;
	bots[lol] = {
		username: username,
		autoplay: autoplay,
		status: botstates.LOGGINGIN,
		place: 0,
		score: 0
	};
	sendPacket(hackop.BOTNEW, i32s(lol)+i32s(gameId)+(autoplay ? "\u0001" : "\u0000")+username.toString());
}

function updateBots(){
	var lol = document.getElementsByTagName("tbody")[0];
	lol.innerHTML = "";
	var i = 1;
	var ss = $("#searchbot").val().toLowerCase();
	bots.filter((e) => ss == "" || e.username.toLowerCase().includes(ss)).forEach(function(entry, index){
		var tr = document.createElement("tr");
		var identifier = bots.indexOf(entry);
		var zz = stateInfo[entry.status];
		[
			i++,
			entry.username,
			"<span class='label label-"+zz.type+"'>"+zz.message+"</span>",
			entry.autoplay ? "On" : "Off",
			entry.place,
			entry.score,
			"<button class=\"btn btn-primary managebot\" bot=\""+identifier+"\" style=\"margin-right: 10px;\">Manage</button><button class=\"btn btn-danger deletebot\" bot=\""+identifier+"\">Delete</button>"
		].forEach(function(e, i){
			var rekt = document.createElement(i == 0 ? "th" : "td");
			rekt.innerHTML = e;
			tr.appendChild(rekt);
		});
		lol.appendChild(tr);
	});
	$(".managebot").unbind();
	$(".managebot").click(function(){
		bo = bots[this.getAttribute("bot")];
		$("#manageform").slideDown();
		$("#manageform").attr("bot", this.getAttribute("bot"));
		$("#manageform").children()[0].children[0].children[1].value = bo.username;
		$("#manageform").children()[0].children[1].children[0].children[0].checked = bo.autoplay;
    });
	$("#managerform").submit(function(e){
		e.preventDefault();
		var identifier = $("#manageform").attr("bot");
		var bo = bots[identifier];
		var newplay = $("#manageform").children()[0].children[1].children[0].children[0].checked;
		if(bo.autoplay != newplay){
			sendPacket(hackop.BOTUPD, i32s(identifier)+"\x00"); //\x00: toggle autoplay
		}
		bo.autoplay = newplay;
		$("#manageform").hide(1000);
		updateBots();
	});
	$(".deletebot").unbind();
	$(".deletebot").click(function(){
		var identifier = this.getAttribute("bot");
		if(bots[identifier].status == botstates.CONNECTED) sendPacket(hackop.BOTUPD, i32s(identifier)+"\x01"); //\x01: delete it
		delete bots[identifier];
		updateBots();
	});
}

setInterval(function(){
	sendPacket(hackop.PING, "", true);
}, 10000);

$(document).ready(function(){
	connect();
	
	nav.forEach(function(e){
		$("#nav_"+e).click(function(){
			nav.forEach(function(e2){
				$("#nav_"+e2).attr("class", null);
				$("#page_"+e2).css("display", "none");
			});
			$("#nav_"+e).attr("class", "active");
			$("#page_"+e).css("display", "block");
		});
    });
	
	$("#addbot").submit(function (e){
		e.preventDefault();
		if(!this.username.value){
			al("You must specify a username!");
			return;
		}
		if(!gameId){
			al("You must set a game id to add bots!");
			return;
		}
		if(botCount >= 1000000){
			al("chill out on the bots bro!");
			return;
		}
		createBot(this.username.value, this.autoplay.checked);
		updateBots();
	});
	
	$("#floodbot").submit(function(e){
		e.preventDefault();
		if(!this.prefix.value){
			al("You must specify a prefix!");
			return;
		}
		if(!gameId){
			al("You must set a game id to add bots!");
			return;
		}
		if(botCount >= 1000000 || this.bamount.value > 100){
			al("chill out on the bots bro!");
			return;
		}
		for(i = 1; i <= this.bamount.value; i++){
			createBot(this.prefix.value+i, this.autoplay.checked);
		}
		updateBots();
    });
	
	$("#searchbot").keyup(updateBots);
	
	$("#setgid").submit(function (e){
		e.preventDefault();
		var gameId = Number(this.gameid.value);
		if(!isNaN(gameId)){
			sendPacket(hackop.CHKGAME, i32s(gameId));
		}else{
			al("Invalid game pin!");
		}
	});
	
	$("#win-form").submit(function(e){
		e.preventDefault();
		place = this.place[0];
		for(i = 0; i < this.place.length; i++){
			if(this.place[i].checked){
				place = this.place[i];
			}
		}
		//yall retards who tried to XSS with this are omegaretarded bc i prevent it on the server :bigbrain:
		window.location.href = "win.php?u="+encodeURIComponent(this.username.value)+"&p="+encodeURIComponent(this.points.value)+"&pl="+encodeURIComponent(place.value);
    });
	
	$("#vip-form").submit(function(e){
		e.preventDefault();
		al("bad key");
	});
	
	$("#po").click(function(){ 
		if($("#kahoot").css("display") == "block"){
			$("#po").html("Close Hack");
			$("#kahoot").css("display", "none");
			$("#hack").css("display", "block");
			if(!adsplaced){
				if(!adsbygoogle) window.adsbygoogle = [];
				for(var i = 0; i < 2; i++) adsbygoogle.push({});
				adsplaced = true;
			}
		}else{
			$("#po").html("Access Hack");
			$("#kahoot").css("display", "block");     
			$("#hack").css("display", "none");
		}
    });
	
	$("#page_bots").css("display", "block");
});