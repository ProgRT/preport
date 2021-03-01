class ptable {

	constructor(target) {
		this.target = document.querySelector(target);
		this.table = document.createElement("table");
		this.thead = document.createElement("thead");
		this.tbody = document.createElement("tbody");
		this.table.appendChild(this.thead);
		this.table.appendChild(this.tbody);

		this.data = [];

		this.columns = [
			{name: "PEEP", type: "number"},
			{name: "Ppl", type: "number"},
			{name: "Pmotrice", type: "result", formule: d => d.Ppl - d.PEEP},
			{name: "Compliance", type: "result"},
			{name: "SpO2", type: "number"},
			{name: "EtCO2", type: "number"},
			{name: "TAM", type: "number"},
			{name: "Commentaire", type: "text"},
		];

		this.extraRowFunc = [ ];
	}

	init() { 
		let row = document.createElement("tr");
		for(let column of this.columns){
			let th = document.createElement("th");
			th.textContent = column.name;
			th.className = column.type;
			row.appendChild(th);
		}
		this.thead.appendChild(row);
		this.target.appendChild(this.table);
	}

	addRow() { 
		let row = document.createElement("tr");
		row.addEventListener('focusin', this.clearEmptyRows);
		for(let column of this.columns){
			switch(column.type){
				case "number":
					var td = document.createElement("td", {is: "td-ed-num"});
					td.addEventListener("keyup", this.createEmptyRow);
					td.addEventListener("keyup", this.updateData);
					break;

				case "result":
					var td = document.createElement("td");
					td.className = column.type;
					break;

				default:
					var td = document.createElement("td", {is: "td-ed"});
					td.addEventListener("keyup", this.createEmptyRow);
					td.addEventListener("keyup", this.updateData);
					break;
			}
			row.appendChild(td);
		}
		this.tbody.appendChild(row);
	}

	max(column) {
		let values = this.data.map(d=>d[column]);
		let min = Math.max(...values);
		let i = values.indexOf(min);

		return this.data[i];
	}

	min(column) {
		let values = this.data.map(d=>d[column]);
		let min = Math.min(...values);
		let i = values.indexOf(min);

		return this.data[i];
	}

	clearEmptyRows = ()=> {
		for(let i in this.tbody.rows){
			let row = this.tbody.rows[i];
			if(i < this.tbody.rows.length -1 && isEmpty(row) && document.activeElement.parentElement != row){
				this.tbody.removeChild(row);
			}
		}
	}

	getData(row){
			let obj = {};

			for(let i in this.columns){
				var column = this.columns[i];
				var cell = row.cells[i];

				switch(column.type){
					case "number":
						obj[column.name] = parseFloat(cell.textContent);
						break;

					case "result":
						if(column.formule){
							let r = column.formule(obj);
							obj[column.name] = r;

							cell.textContent = r || null;
						}
						break;

					default:
						obj[column.name] = cell.textContent;
						break;
				}
			}
		return obj;
	}

	dataToRow(row){
		let PEP = parseFloat(row.cells[0].textContent);
		let dataRow = this.data.find(r=>r.PEP == PEP);

		for(let i = 0; i < this.columns.length; i ++){
			let col = this.columns[i];
			
			if(col.type == 'result' && col.formule == null){
				row.cells[i].textContent = dataRow[col.name]||null;
			}
		}
	}

	updateData = ()=> {
		this.data = [];

		for(let row of this.tbody.rows){
			if(isEmpty(row)){break;}
			else{this.data.push(this.getData(row));}
		}

		this.data.sort((a,b)=>a.PEP - b.PEP);

		for(let func of this.extraRowFunc){
			this.data.map(func);
		}
		for(let row of this.tbody.rows){
			if(isEmpty(row)){break;}
			else{this.dataToRow(row)}
		}

		for(let func of this.postUpdateFunc){setTimeout(func, 900)}
	}

	createEmptyRow = ()=> {
		let rows = this.tbody.rows;
		let numRows = rows.length;
		let lastRow = rows[numRows - 1];
		if(!isEmpty(lastRow)){this.addRow()}
	}
}

function isEmpty(row){
	var empty=true;
	for(let cell of row.cells){
		if(cell.textContent != ""){empty=false}
	}
	return empty;
}
