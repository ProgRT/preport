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
		{name: "EtCO2", type: "number", unit: 'mmHg'},
		{name: "TAM", type: "number", unit: 'mmHg'},
		{name: "Commentaire", type: "text"},
	],
	grconf: {
		padG: 0.05,
		padD: 0.05,
		padH: 0.1,
		margeG: 80,
		margeB: 60,
	},
};

class preport {

	constructor(param) {

		for(let key in prdefaults){
			if(param && param[key]){this[key] = param[key]}
			else{this[key] = prdefaults[key]}
		}
		this.div = document.createElement('div');
		this.div.id = 'preport';

		document.body.appendChild(this.div);

		this.header = document.createElement('header');
		this.div.appendChild(this.header);

		let tp = document.createElement('p');
		tp.classname = 'date';
		tp.textContent = this.dateString();
		this.header.appendChild(tp);

		for(let condition of this.conditions){
			this.header.appendChild(this.condField(condition));
		}

		this.table = new ptable('#preport');
		this.table.columns = this.tableColumns;
		this.table.init();
		this.table.addRow();

		this.table.postUpdateFunc = [
			this.updateGraph
		];

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
		for(let svg of document.querySelectorAll('svg')){
			svg.remove();
		}
		if(data.length > 1){
			for(let column of this.tableColumns.filter(d=>d.graph == true)){
				let numRows = data.filter(d=>!isNaN(d[column.name])).length;
				if(numRows > 1){this.createGraph(column);}
			}
		}
	}

	updateCgraph = ()=>{
		for(let svg of document.querySelectorAll('svg')){
			svg.remove();
		}
		if(
			this.data.length > 0 &&
			!isNaN(this.data[0].Vc) &&
			!isNaN(this.data[0].Ppl) &&
			!isNaN(this.data[0].PEP)
		){this.cGraph();}
	}

	createGraph(column){
		var data = this.data.sort((a,b)=>a.PEP - b.PEP);
		data.sort(d=>d.PEP);
		let fx = d=>d.PEP;
		let fy = d=>d[column.name];
		this.graph = new gs.graph(null, this.grconf);
		this.graph.setscale(data, fx, fy);
		this.graph.tracer(data, fx, fy);
		this.graph.setidx('PEP (hPa)');
		this.graph.setidy(column.name + ' (' + column.unit + ')');
	}

	cGraph(){
		let fx = d=>d.pression;
		let fy = d=>d.volume;

		let conf = this.grconf;
		conf.class = 'cGraph';

		d3.select('#preport')
			.append('svg')
			.attr('id', 'cGraph')
			.attr('class', 'cGraph');

		this.graph = new gs.graph('#cGraph', this.grconf);
		//this.graph = new gs.graph(null, this.grconf);

		this.graph.setscale(this.data[0].points, fx, fy);

		for(let dat of this.data){
			if(
				!isNaN(dat.Vc) &&
				!isNaN(dat.Ppl) &&
				!isNaN(dat.PEP)
			){
				this.graph.tracer(dat.points, fx, fy);

				if(dat.recr){
					this.graph.tracer(dat.recr.points, fx, fy);
				}

			}
			this.graph.AutoscaleAll();
		}

		this.graph.setidx('Pression (hPa)');
		this.graph.setidy('Volume (ml)');
		this.graph.AutoscaleAll();
	}

	get data() {return this.table.data}
	get extraRowFunc() {return this.table.extraRowFunc;}
}
