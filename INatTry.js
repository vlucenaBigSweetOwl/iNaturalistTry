

let table;

let tree;

let counts;

const LOADINGINAT = 0;
const LOADINGTREE = 1;
const MAIN = 2;

let stage = LOADINGINAT;

let taxons = [
	"kingdom",
	"phylum",
	"class",
	"order",
	"family",
	"genus",
	"species"
]

let json = "";

let obsMap = [];

var iNatMap;


class Observ{
	constructor(inJson){
		this.lat = inJson.geojson.coordinates[1];
		this.long = inJson.geojson.coordinates[0];
		print(inJson);
		this.marker = L.circleMarker([this.lat, this.long]).addTo(iNatMap);

		let popuphtml = "";
		if(inJson.photos != null && inJson.photos.length > 0){
			popuphtml += "<img src=\"" + inJson.photos[0].url + "\" alt=\"img\"><br>";
		}
		if(inJson.taxon != null){
			let common = inJson.taxon.prefered_common_name;
			if(common != "" && common != undefined){
				print(common);
				popuphtml += common + "<br>";
			}
			let name = inJson.taxon.name;
			if(name != "" && name != "undefined"){
				popuphtml += "<i>" + name + "</i><br>";
			}
		}
		this.marker.bindPopup(popuphtml);
	}
}

class Bubble{

	constructor(x, y, word){
		this.x = x;
		this.y = y;
		this.word = word.replace(' ','\n');
		this.over = false;
		this.stateTick = 0;
		this.statePos = 0;
		this.stateVel = 0;
		this.r = 50;
		this.textBig = 30;
		this.hue = 0;
		this.back = false;
		textSize(this.textBig);
		let words = this.word.split('\n');
		let big = 0;
		for(let w of words){
			big = max(textWidth(w),big);
		}
		while(big > this.r*2 - GIVE){
			this.textBig--;
			textSize(this.textBig);
			big = 0;
			for(let w of words){
				big = max(textWidth(w),big);
			}
		}
	}

	mouseOverCheck(){
		this.over = dist(mouseX,mouseY,this.x,this.y) < this.r;
		if(this.over){
			this.stateTick=100;
		} else {
			this.stateTick=0;
		}
		this.stateTick = constrain(this.stateTick,0,100);
	}

	mousePressedCheck(){
		if(this.over){
			if(this.back){
				subgroup.pop();
				if(subgroup.length > 0){
					transBubble = new Bubble(this.x,this.y,subgroup[subgroup.length-1]);
				} else {
					transBubble =  new Bubble(this.x,this.y,"Everything");
				}
			} else {
				transBubble = this;
				subgroup.push(this.word);
			}
			bubbles = [];
			transState = 100;
		}
	}

	display(){
		print(this.hue);
		this.display(this.hue);
	}

	display(hue){
		if(hue == -1){
			hue = this.hue;
		}
		this.hue = hue;
		//let stateTarget = sin(map(this.stateTick,0,100,0,PI*.5))*100;
		let stateTarget = this.stateTick;
		this.stateVel += (stateTarget - this.statePos)*.05;
		this.stateVel -= this.stateVel * 0.2;
		this.statePos += this.stateVel;
		//this.statePos = constrain(this.statePos,0,100);
		let scale = map(this.statePos,0,100,1,1.5);

		stroke(hue,155,100);

		line(this.x,this.y,width*.5,height*(5.0/6));
		stroke(hue,155,255);

		fill(0);
		if(this.over){
			fill(0,0,100);
		}
		strokeWeight(3);
		ellipse(this.x,this.y,this.r*2*scale,this.r*2*scale);
		fill(hue,100,255);
		if(this.over){
			fill(hue,50,255);
		}
		noStroke();
		textSize(this.textBig*scale*0.9);
		let y = map(this.statePos,0,100,this.y,this.y-this.r*.5);
		text(this.word,this.x,y);
	}


}

function preload(){
	//table = loadTable("test2.csv","csv","header");

	var totalResults = 100000;
	function loadData(page){
		const xhttp = new XMLHttpRequest();
		xhttp.onload = function(){
			if(json == ""){
				json = JSON.parse(this.responseText);
				totalResults = json.total_results;
			} else {
				json.results = json.results.concat(JSON.parse(this.responseText).results);
			}
			
			console.log(json.results.length);
			if(page*200 < totalResults){
				loadData(page+1);
				//if(stage == LOADINGINAT){
				//	loadMap();
				//}
			} else {
				if(stage == LOADINGINAT){
					loadMap();
				}
			}
		}
		xhttp.open("GET","https://api.inaturalist.org/v1/observations?project_id=119110&page="+page+"&per_page=200&order=desc&order_by=created_at");
		xhttp.send();
	}

	loadData(1);
}

function loadMap(){

	 iNatMap = L.map('map').setView([json.results[0].geojson.coordinates[1], json.results[0].geojson.coordinates[0]], 13);
			L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
			    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
			    maxZoom: 18,
			    id: 'mapbox/streets-v11',
			    tileSize: 512,
			    zoomOffset: -1,
			    accessToken: 'pk.eyJ1Ijoidmx1Y2VuYSIsImEiOiJjbDFlMGNqdXowbXY3M2NwNmRnb2czcmJpIn0.ZiCM-MFgwpurOrQxxBaZug'
			}).addTo(iNatMap);
	stage = LOADINGTREE;
}

function setup(){
	createCanvas(screen.width/2,600);
	tree = new Map();
	counts = new Map();

	textAlign(CENTER,CENTER);
	colorMode(HSB,255);
	transBubble = new Bubble(width*.5,height*(5.0/6),"Everything");
}

function loadTree(){
	let level;
	let name;
	let taxon;
	for(let i = 0; i < json.results.length; i++){
		obsMap[i] = new Observ(json.results[i]);
	}
	print(obsMap);
	
	let anci = 0;
	for(let row of json.results){
		print(row);
		level = tree;
		anci = 0;
		if(row.identifications[row.identifications.length-1] == null){
			continue;
		}
		taxon = row.identifications[row.identifications.length-1].taxon;
		for(let i = 0; i < taxons.length; i++){
			while(anci < taxon.ancestors.length && taxon.ancestors[anci].rank != taxons[i]){
				anci++;
			}

			if(anci >= taxon.ancestors.length){
				name = undefined;
			} else {
				name = taxon.ancestors[anci].name;
			}
			
			if(counts.get(name) == undefined){
				counts.set(name,1);
			} else {
				counts.set(name,counts.get(name)+1);
			}
			if(name == undefined || name == ""){
				name = "unknown";
				if(level.get(name) == undefined){
					level.set(name,1);
				} else {
					level.set(name,level.get(name)+1);
				}
				break;
			} else {
				if(i == taxons.length-1){
					if(level.get(name) == undefined){
						level.set(name,0);
					}
					level.set(name,level.get(name)+1);
				} else {
					if(level.get(name) == undefined){
						level.set(name,new Map());
					}
					level = level.get(name);
				}
			}
		}
	}
	

	//print(tree);
	stage = MAIN;
}

let subgroup = [];

let rangeFlag = 0;
let rangeStart = 0;
let rangeSize = 255;

let GIVE = 8;

let rotPos;
let rotVel = 0;
let rotDrag = 0.05;

let transState = -1;
let transBubble;
let bubbles = [];

function calcbubbles(level){
	let i = 0;
	let rot = 0;
	if(level.size > 1){
		rot = PI*2/(level.size-1);
		rot = min(PI*.13, rot);
	}
	for(let m of level){
		let x = width/2 + sin(rot*i+rotPos)*height*(4.0/6);
		let y = height*(5.0/6) + cos(rot*i+rotPos)*height*(4.0/6);
		bubbles[i] = new Bubble(x,y,m[0]);
		i++;
	}
	rotPos = PI - rot*i*.5;
}

function updatebubbles(level){
	let i = 0;
	let rot = 0;
	if(level.size > 1){
		rot = PI*2/(level.size-1);
		rot = min(PI*.13, rot);
	}
	for(let m of level){
		let x = width/2 + sin(rot*i+rotPos)*height*(4.0/6);
		let y = height*(5.0/6) + cos(rot*i+rotPos)*height*(4.0/6);
		bubbles[i].x = x;
		bubbles[i].y = y;
		i++;
	}
	return rot;
}

function draw(){
	background(0);
	fill(255);
	textSize(20);
	if (stage == LOADINGINAT){
		if(json == ""){
			text("loading ...",width/2, height/2);
		} else {
			text("loaded " + json.results.length + " observations ...",width/2, height/2);
		}
	} else if (stage == LOADINGTREE){
		text("making tree ...",width/2,height/2);
		loadTree();
		stage = MAIN;
	} else if(stage == MAIN){
		background(0);
		let camx = 0;
		let camy = 0;
		if(transState > 0){
			let offx = width*.5 - transBubble.x;
			let offy = height*(5.0/6)- transBubble.y;
			let transMap = (cos(map(transState,100,0,0,PI))+1)*50;
			camx = map(transMap,100,0,-offx,0);
			camy = map(transMap,100,0,-offy,0);
			translate(camx,camy);
		}

		let level = tree;
		for(let i = 0; i < subgroup.length; i++){
			level = level.get(subgroup[i]);
		}
		if(rangeFlag != -1){
			rangeSize = rangeSize * (1.0/level.size);
			rangeStart = rangeStart + rangeFlag * rangeSize;
			rangeFlag = -1;
		}
		rotPos += rotVel;
		rotVel -= rotVel*rotDrag;
		if(bubbles.length == 0){
			let arc = calcbubbles(level);

		} else {
			updatebubbles(level);
		}
		
		let i = 0;
		for(let b of bubbles){
			b.mouseOverCheck();
			b.display(255*(1.0*i/bubbles.length));
			i++;
		}

		if(pressed){
			let redo = false;
			let difx = pmouseX - mouseX;
			let dify = pmouseY - mouseY; 
			let normd = dist(mouseX,mouseY,width*.5,height*(5.0/6));
			let normx = (mouseX - width*.5)/normd;
			let normy = (mouseY - height*(5.0/6))/normd;
			let tanx = -normy;
			let tany = normx;
			rotVel = tan((difx*tanx + dify*tany)/normd);
		}

		if(transState > 0){
			resetMatrix();


			fill(0,transState*3);
			rect(0,0,width,height);

			let offx = width*.5 - transBubble.x;
			let offy = height*(5.0/6)- transBubble.y;
			let transMap = (cos(map(transState,100,0,0,PI))+1)*50;
			camx = map(transMap,100,0,0,offx);
			camy = map(transMap,100,0,0,offy);
			translate(camx,camy);


			transBubble.over = false;
			transBubble.stateTick=0;
		} else {
			transBubble.x = width*.5;
			transBubble.y = height*(5.0/6);
			transBubble.back = true;
		}

		transBubble.mouseOverCheck();
		transBubble.display(-1);

		transState-=2;
	}
}

let overSketch = false;
let pressed = false;

function mousePressed(){
	overSketch = true;
	pressed = true;
	transBubble.mousePressedCheck();
	for(let b of bubbles){
		b.mousePressedCheck();
	}
}

function mouseReleased(){
	pressed = false;
}

