

let table;

let tree;

let counts;

const LOADINGINAT = 0;
const LOADINGTREE = 1;
const MAIN = 2;

let stage = LOADINGINAT;

let taxons = [
	"taxon_kingdom_name",
	"taxon_phylum_name",
	"taxon_class_name",
	"taxon_order_name",
	"taxon_family_name",
	"taxon_genus_name",
	"taxon_species_name"
]

let json = "";

let obsMap = [];

var map;

class Observ{
	constructor(inJson){
		this.lat = inJson.geojson.coordinates[1];
		this.long = inJson.geojson.coordinates[0];
		print(inJson);
		this.marker = L.circleMarker([this.lat, this.long]).addTo(map);
		let popuphtml = "";
		if(inJson.photos.length > 0){
			popuphtml += "<img src=\"" + inJson.photos[0].url + "\" alt=\"img\"><br>";
		}
		let common = inJson.taxon.prefered_common_name;
		if(common != "" && common != undefined){
			print(common);
			popuphtml += common + "<br>";
		}
		let name = inJson.taxon.name;
		if(name != "" && name != "undefined"){
			popuphtml += "<i>" + name + "</i><br>";
		}
		this.marker.bindPopup(popuphtml);
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
				//loadData(page+1);
				if(stage == LOADINGINAT){
					loadMap();
				}
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

	 map = L.map('map').setView([json.results[0].geojson.coordinates[1], json.results[0].geojson.coordinates[0]], 13);
			L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
			    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
			    maxZoom: 18,
			    id: 'mapbox/streets-v11',
			    tileSize: 512,
			    zoomOffset: -1,
			    accessToken: 'pk.eyJ1Ijoidmx1Y2VuYSIsImEiOiJjbDFlMGNqdXowbXY3M2NwNmRnb2czcmJpIn0.ZiCM-MFgwpurOrQxxBaZug'
			}).addTo(map);
	stage = LOADINGTREE;
}

function setup(){
	createCanvas(screen.width/2,600);
	tree = new Map();
	counts = new Map();

	textAlign(CENTER,CENTER);
	colorMode(HSB,255);
}

function loadTree(){
	let level;
	let name;
	for(let i = 0; i < json.results.length; i++){
		obsMap[i] = new Observ(json.results[i]);
	}
	print(obsMap);
	/*
	for(let row of json.results){
		print(row);
		level = tree;
		for(let i = 0; i < taxons.length; i++){
			name = row.scope[taxons[i]];
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
	*/

	//print(tree);
	stage = MAIN;
}

let subgroup = [];
let circSize = 100;
let transState = -1;
let savei = -1;
let saveName = -1;
let saveText = 20;
let saveRot = 0;

let rangeFlag = 0;
let rangeStart = 0;
let rangeSize = 255;

function draw(){
	background(100);
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
		let level = tree;
		for(let i = 0; i < subgroup.length; i++){
			level = level.get(subgroup[i]);
		}
		if(rangeFlag != -1){
			rangeSize = rangeSize * (1.0/level.size);
			rangeStart = rangeStart + rangeFlag * rangeSize;
			rangeFlag = -1;
		}
		let i = 0;
		let rot = PI*2.0/level.size;
		for(let m of level){
			let x = width/2 + sin(rot*i+saveRot)*200;
			let y = height/2 + cos(rot*i+saveRot)*200;
			noFill();
			stroke(rangeStart+rangeSize*i,255,255);
			strokeWeight(1);
			ellipse(x,y,circSize,circSize);
			fill(rangeStart+rangeSize*i,255,255)
			noStroke();
			let textBig = 20;
			textSize(textBig);
			textMap = m[0];
			textMap.replace(' ','\n');
			while(textWidth(textMap) > circSize){
				textBig--;
				textSize(textBig);
			}

			text(textMap,x,y);
			i++;
		}
		if(transState > 0){
			let transMap = 100 - ((cos(map(transState,0,100,0,PI))+1)*50);
			fill(0,transMap*3);
			rect(0,0,width,height);
			let x = width/2 + sin(saveRot)*200;
			let y = height/2 + cos(saveRot)*200;
			x = map(transMap,100,0,x,width/2);
			y = map(transMap,100,0,y,height/2);
			let sizeMult = map(transMap,100,0,1,width*1.0/circSize);
			noFill();
			stroke(255, transMap*2);
			strokeWeight(sizeMult);
			ellipse(x,y,circSize*sizeMult,circSize*sizeMult);
			fill(255,  transMap*2)
			noStroke();
			textSize(saveText*sizeMult);
			text(saveName,x,y);
		}

		transState-=2;
	}
}

function mousePressed(){
	let level = tree;
	for(let i = 0; i < subgroup.length; i++){
		level = level.get(subgroup[i]);
	}
	let i = 0;
	let rot = PI*2.0/level.size;
	for(let m of level){
		let x = width/2 + sin(rot*i+saveRot)*200;
		let y = height/2 + cos(rot*i+saveRot)*200;
		if(dist(mouseX,mouseY,x,y) < circSize){
			subgroup.push(m[0]);
			saveRot += rot*i;
			saveName = m[0];
			transState = 100;
			let textBig = 20;
			textSize(textBig);
			while(textWidth(saveName) > circSize){
				textBig--;
				textSize(textBig);
			}
			saveText = textBig;
			rangeFlag = i;
		}
		i++;
	}
}

