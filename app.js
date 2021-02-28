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
		if(i == t.length - 1){
			d.Vstart = 0;
			d.Vstart += d.Vdiff||0;
		}
	},

	// If not lowest PEEP, Vstart = preceding PEEP Vstart + Precedinrg
	// PEEP  Vt
	(d,i,t)=>{
		if(i != t.length - 1){
			let prec = t[i + 1];
			//let Vstart = 0;
			//if(prec.Vstart){Vstart += prec.Vstart}
			//if(prec.Vc){Vstart += d.Vdiff}

			//d.Vstart = Vstart;
			d.Vstart = 0;
			d.Vstart += d.Vdiff || 0;
			d.Vstart += prec.Vstart || 0;
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
		if(i < t.length - 1){
			d.recr = {};
			d.recr.Pmotrice = d.PEP - t[i+1].PEP;
			d.recr.Cst = d.Vdiff / d.recr.Pmotrice;
			d.recr.points = [
					{pression: t[i+1].PEP, volume: t[i+1].Vstart},
					{pression: d.PEP, volume: d.Vstart},
				];
			d.RI = Math.round(10 * d.recr.Cst / t[i+1].Cst)/10;
		};
	}
];
