// ---------------
// Class
// ---------------

export class tdEd extends HTMLTableCellElement {
	constructor() {
		super();
		this.contentEditable=true;
	}
}

export class tdEdNum extends tdEd {
	constructor() {
		super();
		this.className = "number";
		this.style.textAlign = "center";
		this.addEventListener("keydown", verifNum);
	}
}

// ---------------
// Events handlers
// ---------------

export function verifNum(evt){
		let authorized = [
			'1', '2', '3', '4', '5', '6', '7', '8', '9', '0',
			'.', '-',
			'Tab', 'Backspace', 'Delete', 
			'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'
		];

	if(
		! authorized.includes(evt.key) &&
		! evt.ctrlKey &&
		! evt.ctrlLeft &&
		! evt.altKey
	){evt.preventDefault()}
}

// -------------
// Definitions
// -------------

window.customElements.define("td-ed", tdEd, {extends: "td"});
window.customElements.define("td-ed-num", tdEdNum, {extends: "td"});
