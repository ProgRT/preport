const settings = {
	langue: 'fr-ca',
	conditions: [
	],
	tableColumns: [
		{name: "PEP", type: "number", unit: 'hPa'},
		{name: "Ppl", type: "number", unit: 'hPa'},
		{name: 'Vc', type: 'number', unit: 'ml'},
		{name: 'Vcder', type: 'number', unit: 'ml'},
		{name: 'Vdiff', type: 'result', unit: 'ml', formule: d=>d.Vcder - d.Vc},
		{name: "Pmotrice", type: "result", formule: d => d.Ppl - d.PEP, unit: 'cmH2O', graph: true},
		{name: "Cst", type: "result", unit: 'ml/hPa', formule: d=>Math.round(10*d.Vc/d.Pmotrice)/10},
		{name: 'RI', type: 'result'},
		{name: "SpO2", type: "number", unit: '%'},
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

let report = new preport(settings);

report.table.postUpdateFunc = [
	report.updateCgraph
];

report.table.extraRowFunc = [
	// Lowest PEEP Vstart  = 0
	(d,i,t)=>{
		if(i == 0){
			d.Vstart = 0;
			d.Vstart += d.Vdiff||0;
		}
	},

	// If not lowest PEEP, Vstart = preceding PEEP Vstart + Precedinrg
	// PEEP  Vt
	(d,i,t)=>{
		if(i > 0){

			d.Vstart = 0;
			d.Vstart += d.Vdiff || 0;
			for(let ind = 0;ind < i;ind ++){
				d.Vstart += t[ind].Vdiff || 0;
			}
		}
	},

	// Vend = Vstart + Vt
	(d,i,t)=>{
		d.Vend = d.Vstart + d.Vc;
	},

	// Creation of the points fro plotting
	(d,i,t)=>{
		d.points = [
			{pression: d.PEP, volume: d.Vstart},
			{pression: d.Ppl, volume: d.Vend},
		]; 
	},

	// Description of the recruitment between PEEP levels
	(d,i,t)=>{
		if(i > 0){
			d.recr = {};
			d.deltaPEP = d.PEP - t[i-1].PEP;
			d.Vrec = d.Vstart - (t[i-1].Vstart + (d.deltaPEP * t[i-1].Cst));
			d.Crecr = d.Vrec / d.deltaPEP;
			d.RI = Math.round(100 * d.Crecr / t[i-1].Cst)/100;
		};
	}
];
