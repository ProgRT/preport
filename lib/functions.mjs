export const zeroStartVolume = (d,i,t) => {
	if(i == 0){
		d.Vstart = 0;
		d.Vstart += d.Vdiff||0;
	}
};

export const calcPoints = (d,i,t) => {
	d.points = [
		{pression: d.PEP, volume: d.Vstart},
		{pression: d.Ppl, volume: d.Vstart + d.Vc},
	]; 
};

export const calcRecr = (d,i,t) => {
	if(i > 0){
		d.deltaPEP = d.PEP - t[i-1].PEP;
		d.Vrec = Math.round(d.Vstart - (t[i-1].Vstart + (d.deltaPEP * t[i-1].Cst)));
		d.Crecr = d.Vrec / d.deltaPEP;
		d.RI = Math.round(100 * d.Crecr / t[i-1].Cst)/100;
	};
};

export const calcVstart =(d,i,t)=>{
	if(i > 0){

		d.Vstart = 0;
		d.Vstart += d.Vdiff || 0;
		for(let ind = 0;ind < i;ind ++){
			d.Vstart += t[ind].Vdiff || 0;
		}
	}
};
