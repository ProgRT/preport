import {ptable} from './ptable.mjs';
import {graph} from './graphsimple.mjs';

const prdefaults = {

	langue: 'fr-ca',
	conditions: [
		{name: "Vc", unit: 'ml'},
		{name: 'FiO2', unit: '%'},
	],
	tableColumns: [
		{name: "PEP", type: "number", unit: 'hPa'},
		{name: "Ppl", type: "number", unit: 'hPa'},
		{name: 'Vc', type: 'number', unit: 'ml'},
		{name: "Pmotrice", type: "result", formule: d => d.Ppl - d.PEP, unit: 'cmH2O', graph: true},
		{name: "Compliance", type: "result", unit: 'ml/hPa', formule: d=>Math.round(10*d.Vc/d.Pmotrice)/10},
		{name: "SpO2", type: "number", graph:true, unit: '%'},
		{name: "EtCO2", type: "number", unit: 'mmHg', graph: true},
		{name: "TAM", type: "number", unit: 'mmHg', graph: true},
		{name: "Commentaire", type: "text"},
	],
	grconf: {
		padG: 0.05,
		padD: 0.05,
		padH: 0.1,
		padB: 0.1,
		margeG: 80,
		margeB: 60,
	},
	postUpdateFunc: []
};

export class preport {

	constructor(param) {

		for(let key in prdefaults){
			if(param && param[key]){this[key] = param[key]}
			else{this[key] = prdefaults[key]}
		}

		this.div = document.querySelector('#preport');

		this.header = document.createElement('div');
		this.div.appendChild(this.header);

		let tp = document.createElement('p');
		tp.classname = 'date';
		tp.textContent = this.dateString();
		document.querySelector('header>div').appendChild(tp);

		for(let condition of this.conditions){
			this.header.appendChild(this.condField(condition));
		}

		this.table = new ptable('#preport', {extraRowFunc: param.extraRowFunc});
		this.table.columns = this.tableColumns;
		this.table.init();
		this.table.addRow();
		this.table.table.rows[1].cells[0].autofocus = true;

		this.table.postUpdateFunc = [
			this.updateGraph
		];
		
		for(let funcName of this.postUpdateFunc){
			this.table.postUpdateFunc.push(this[funcName]);
		}

		this.grdiv = document.createElement('div');
		this.grdiv.id = 'preportGrDiv';
		this.div.appendChild(this.grdiv);

		this.cgraphdiv = document.createElement('div');
		this.cgraphdiv.id = 'preportCgraphDiv';
		this.grdiv.appendChild(this.cgraphdiv);

		this.trdiv = document.createElement('div');
		this.trdiv.id = 'preportTrDiv';
		this.grdiv.appendChild(this.trdiv);
	}

	translate(string) {
		return dict[string] || string;
	}

	dateString() {
		let d = new Date();
		let p = {
					year: 'numeric', 
					month: 'long', 
					day: 'numeric', 
					weekday: 'long',
					hour: 'numeric',
					minute: 'numeric'
				};
		var s = d.toLocaleString(this.langue, p);
		s = s[0].toUpperCase() + s.substring(1);
		return s;
	}

	condField(condition) {
		let lbspan = document.createElement('span');
		lbspan.textContent = condition.name + ' : ';

		let ispan = document.createElement('span');
		ispan.contentEditable = true;
		ispan.className = 'ispan';
		ispan.addEventListener("keydown", verifNum);
		ispan.addEventListener("keydown", startCtrl);
		ispan.addEventListener("keyup", stopCtrl);
		ispan.addEventListener("keyup", ()=>{
			this[condition.name] = parseFloat(ispan.textContent);
			this.table.updateData();
		});

		let uspan = document.createElement('span');
		uspan.className = 'unit';
		uspan.textContent = ' ' + condition.unit;

		let div = document.createElement('div');
		div.classname = 'condition';
		div.appendChild(lbspan);
		div.appendChild(ispan);
		div.appendChild(uspan);

		return div;
	}

	updateGraph = ()=> {
		let data = this.data;
		for(let svg of document.querySelectorAll('svg.tGraph')){svg.remove();}
		if(data.length > 1){
			for(let column of this.tableColumns.filter(d=>d.graph == true)){
				let numRows = data.filter(d=>!isNaN(d[column.name])).length;
				if(numRows > 1){this.createGraph(column);}
			}
		}
	}

	updateCgraph = ()=>{
		for(let svg of document.querySelectorAll('svg#cGraph')){svg.remove()}
		if(this.plotable.length > 0){this.cGraph();}
	}

	createGraph(column){
		var data = this.data.sort((a,b)=>a.PEP - b.PEP);
		data.sort(d=>d.PEP);

		let fx = d=>d.PEP;
		let fy = d=>d[column.name];
		let grconf = this.grconf;
		grconf.zeromin = false;

		d3.select('#preportTrDiv')
			.append('svg')
			.attr('id', 'gr' + column.name)
			.attr('class', 'tGraph');

		let g = new graph('#gr' + column.name, this.grconf);
		g.setscale(data, fx, fy);
		g.tracer(data, fx, fy);
		g.setidx('PEP (hPa)');
		g.setidy(column.name + ' (' + column.unit + ')');
	}

	cGraph(){
		let fx = d=>d.pression;
		let fy = d=>d.volume;

		let conf = this.grconf;
		//conf.class = 'cGraph';

		d3.select('#preportCgraphDiv')
			.append('svg')
			.attr('id', 'cGraph');

		this.graph = new graph('#cGraph', this.grconf);

		this.graph.setscale(this.data[0].points, fx, fy);

		for(let dat of this.plotable){
			this.graph.tracer(dat.points, fx, fy);
			this.graph.AutoscaleAll();
		}

		for(let d of this.plotable.filter(d=>d.Vrec)){
			this.graph.ply( {
				min: d.Vstart - d.Vrec,
				max: d.Vstart,
				x: d.PEP,
				id: d.Vrec + ' ml',
				labelShift: -3,
				});
		}

		this.graph.setidx('Pression (hPa)');
		this.graph.setidy('Volume (ml)');
		this.graph.AutoscaleAll();
	}

	get plotable(){ 
		return this.data.filter(d=>isPlotable(d))
	};

	get data() {return this.table.data}
	//get extraRowFunc() {return this.table.extraRowFunc;}
}

function isPlotable(d){
	return !isNaN(d.Vc) && !isNaN(d.Ppl) && !isNaN(d.PEP);
}
