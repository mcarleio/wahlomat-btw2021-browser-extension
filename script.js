setTimeout(() => {
	

if (!window.original_calculate) {	
	window.original_calculate = calculate
}
calculate = () => {
	original_calculate();
	localStorage.setItem('S_aThesen', JSON.stringify(S_aThesen))
}

const loadedS_aThesen = localStorage.getItem('S_aThesen');
if (loadedS_aThesen) {
	console.log('Restore old thesen: ', loadedS_aThesen);
	S_aThesen = JSON.parse(loadedS_aThesen);
	wom_switch_page(3);
}

}, 1000);