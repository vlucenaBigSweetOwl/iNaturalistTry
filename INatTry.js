
let table;

let tree;

let counts;

let taxons = [
	"taxon_kingdom_name",
	"taxon_phylum_name",
	"taxon_class_name",
	"taxon_order_name",
	"taxon_family_name",
	"taxon_genus_name",
	"taxon_species_name"
]

function preload(){
	table = loadTable("test2.csv","csv","header");
}

function setup(){
	createCanvas(800,600);
	tree = new Map();
	counts = new Map();

	print("hi");
	let row = table.getRows()[0];
	let level;
	let name;
	for(let row of table.getRows()){
		level = tree;
		for(let i = 0; i < taxons.length; i++){
			name = row.getString(taxons[i]);
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

	print(tree);

	textAlign(CENTER,CENTER);
	colorMode(HSB,255);
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
	background(0);

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