import {preport} from './lib/preport.mjs';
import {zeroStartVolume, calcVstart, calcPoints, calcRecr} from './lib/functions.mjs';

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
		{name: "Pmotrice", type: "result", formule: d => d.Ppl - d.PEP, unit: 'cmH2O'},
		{name: "Cst", type: "result", unit: 'ml/hPa', graph: true, formule: d=>Math.round(10*d.Vc/d.Pmotrice)/10},
		{name: 'Vrec', type: 'result'},
		{name: 'RI', type: 'result'},
		{name: "SpO2", type: "number", unit: '%', graph: true},
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
		margeB: 52,
		margeH: 5
	},
	extraRowFunc: [
		zeroStartVolume, // Lowest PEEP Vstart  = 0
		calcVstart,      // If not lowest PEEP, Vstart = preceding PEEP Vstart + Precedinrg PEEP  Vt
		calcPoints,      // Creation of the points fro plotting
		calcRecr         // Description of the recruitment between PEEP levels
	],
	postUpdateFunc: ['updateGraph']
};

let report = new preport(settings);
