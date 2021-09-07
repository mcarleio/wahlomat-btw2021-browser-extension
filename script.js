
/*
 * Koalitionen
 */
const koalitionen = [
    {
        name: "Schwarz-Rot-Grüne Koalition",
        parties: ["CDU / CSU", "SPD", "GRÜNE"]
    },
    {
        name: "Schwarz-Rot-Gelbe Koalition",
        parties: ["CDU / CSU", "SPD", "FDP"]
    },
    {
        name: "Ampelkoalition",
        parties: ["SPD", "FDP", "GRÜNE"]
    },
    {
        name: "Jamaika-Koalition",
        parties: ["CDU / CSU", "FDP", "GRÜNE"]
    },
    {
        name: "Rot-Rot-Grüne Koalition",
        parties: ["SPD", "DIE LINKE", "GRÜNE"]
    },
    {
        name: "Große Koalition",
        parties: ["CDU / CSU", "SPD"]
    },
    {
        name: "Rot-Grüne Koalition",
        parties: ["SPD", "GRÜNE"]
    },
    {
        name: "Schwarz-Grüne Koalition",
        parties: ["CDU / CSU", "GRÜNE"]
    },
    {
        name: "Schwarz-Gelbe Koalition",
        parties: ["CDU / CSU", "FDP"]
    }
];

/*
 * Umfragedaten
 */
const seatsDataFrom = "https://dawum.de/Bundestag/";
const seatsDataDate = "06.09.2021";

const seatCount = 598
const seatDistribution = {
    "CDU / CSU": 138,
    "SPD": 160,
    "GRÜNE": 109,
    "FDP": 77,
    "DIE LINKE": 43,
}

const colorMap = {
    "CDU / CSU": 'black',
    "SPD": 'red',
    "GRÜNE": 'green',
    "FDP": 'yellow',
    "DIE LINKE": 'purple',
	"AfD": 'blue'
}

/*
 * Funktionen 
 */
function calculatePercentageShare(koalition) {
    const seatsPerParty = koalition.parties.map(partyName => seatDistribution[partyName]);
    const koalitionSeatCount = seatsPerParty.reduce((a,b)=>a+b);
 
    return seatsPerParty.map(it => it / koalitionSeatCount);
}


function calculateTheseForKoalition(thesenIndex, koalition, percentageShare) {
    const koalitionsWert = koalition.parties
        .map(partyName => WOMT_aThesenParteien[thesenIndex][getPartyIndex(partyName)])
        .map((it, index) => it * percentageShare[index])
        .reduce((a,b)=> a+b);
    
    return Math.max(-1, Math.min(1, koalitionsWert));
}

function determineThesenForKoalition(koalition, percentageShare) {
    return [...Array(WOMT_nThesen)].map((_, thesenIndex) => calculateTheseForKoalition(thesenIndex, koalition, percentageShare));
}

function getPartyIndex(partyName) {
    return [...Array(WOMT_nParteien)].map((_, index) => WOM.getParty(index)).find(p => p.getName(true) === partyName).getId();
}

function generateLogo(koalition) {
    let svg = `<?xml version="1.0" encoding="UTF-8" standalone="no" ?>
    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="150" height="150" viewBox="0 0 150 150">
    `;

    const width = 150 / koalition.parties.length;
    for (let index = 0; index < koalition.parties.length; index++) {
        svg += `<polygon points="${width*index},0 ${width*(index+1)},0 ${width*(index+1)},150 ${width*index},150" style="fill: ${colorMap[koalition.parties[index]]}"/>`
    }
    svg += `</svg>`;
    return svg;
}

function convertLogoToDataURI(svg) {
    return `data:image/svg+xml;base64,${btoa(svg)}`;
}

function findPartyIndexByName(partyName) {
    return WOMT_aParteien.map((it, index) => [index, it[S_nSprache][1] === partyName]).find(it => it[1])?.[0]
}

function addStylesForColoredResultBars(koalition, koalitionPartyIndex, percentageShare) {
    const colorGradient = percentageShare.map(it => Math.round(it * 100)).map((share, index, arr) => {
        const color = colorMap[koalition.parties[index]];
        const startValue = arr.slice(0, index).reduce((a,b)=>a+b, 0);
        const endValue = startValue + share;
        return `${color} ${startValue.toFixed(0)}% ${endValue.toFixed(0)}%`
    }).join();

    const customStyle = document.createElement('style');
    customStyle.innerHTML = `
	#results-li-${koalitionPartyIndex+1} .results__bar { background-image: linear-gradient(to right, ${colorGradient}) }
	#results-panel-${koalitionPartyIndex+1} .results__action-wrapper a { display: none; }
	.party-selection__panel[aria-labelledby="party-selection-${koalitionPartyIndex+1}"] .party-selection__more-link { visibility: hidden; }
	`;
    document.head.appendChild(customStyle);
}

transpose = m => m[0].map((x,i) => m.map(x => x[i]))

/*
 * Überschreibe Funktion, um aus den errechneten Werten die erlaubten Werte [-1,0,1] zu ermitteln
 */
if (!window.original_getPartyData) {
    window.original_getPartyData = getPartyData
}
getPartyData = (a,b,c,d,e,f) => {
    const origResult = original_getPartyData(a,b,c,d,e,f);
    
    for (let parteiIndex = 0; parteiIndex < WOMT_nParteien; parteiIndex++) {
        const partei = origResult[parteiIndex]
        
        for (thesenIndex = 0; thesenIndex < WOMT_nThesen; thesenIndex++) {
            if (WOMT_aThesenParteien[thesenIndex][parteiIndex] <= -0.34) {
                partei.antworten[thesenIndex].antwort = -1
            } else if (WOMT_aThesenParteien[thesenIndex][parteiIndex] >= 0.32) {
                partei.antworten[thesenIndex].antwort = 1
            } else {
                partei.antworten[thesenIndex].antwort = 0
            }
        }
    }

    return origResult;
}

/*
 *  Erweitert vorhandene Funktion um IDs an li-Elemente zu definieren (für das Styling der farbigen Ergebnisbalken) 
 */
if (!window.original_wom_switch_page) {
    window.original_wom_switch_page = wom_switch_page
}

/** Fügt die Partei ID+1 zum li-Element hinzu */
wom_switch_page = (a,b,c,d,e,f) => {
    original_wom_switch_page(a,b,c,d,e,f);
    document
        .querySelectorAll('li.results__list-item > .results__panel-wrapper')
        .forEach(panel => panel.parentNode.id = panel.id.replace('-panel-', '-li-')); // => li#results-li-${partyId}
}



(() => {
	
	/*
	 *	Überschreibe die calculate-Methode um die Benutzer-Eingaben zu speichern
	 */
	if (!window.original_calculate) {	
		window.original_calculate = calculate
	}
	calculate = (a,b,c,d,e,f) => {
		original_calculate(a,b,c,d,e,f);
		localStorage.setItem('S_aThesen', JSON.stringify(S_aThesen))
	}

	/*
	 *	Falls gespeicherte User Thesen vorhanden sind, stelle sie wieder her 
	 */
	const loadedS_aThesen = localStorage.getItem('S_aThesen');
	if (loadedS_aThesen) {
		setTimeout(() => {
			console.log('Restore old thesen: ', loadedS_aThesen);
			S_aThesen = JSON.parse(loadedS_aThesen);
			wom_switch_page(3); // Leite auf die Seite zur Auswahl der Parteien weiter
		}, 1000);
	}


	/*
	* Koalitionen mit Umfragedaten anreichern und basierend darauf die Antworten auf die Thesen berechnen 
	*/
	for (let index=0; index < koalitionen.length; index++ ) {
		const koalition = koalitionen[index];

		const koalitionPercentage = (koalition.parties.map(it => seatDistribution[it]).reduce((a,b)=>a+b) / seatCount) * 100
		const percentageShare = calculatePercentageShare(koalition);

		const koalitionThesen = determineThesenForKoalition(koalition, percentageShare)

		let koalitionPartyIndex = findPartyIndexByName(koalition.name);
		if (koalitionPartyIndex === undefined) {
			koalitionPartyIndex = WOMT_nParteien++;
		}
		
		WOMT_aParteien[koalitionPartyIndex] = [];
		WOMT_aParteienBeschreibung[koalitionPartyIndex] = [];
		WOMT_aParteienLogos[koalitionPartyIndex] = [];

		WOMT_aParteien[koalitionPartyIndex][S_nSprache] = [koalition.name, koalition.name];
		WOMT_aParteienBeschreibung[koalitionPartyIndex][S_nSprache] = `
		<p style="margin-bottom: 1em">${koalition.name} bestehend aus ${koalition.parties.slice(0, -1).join(", ")} und ${koalition.parties.slice(-1)}</p>
		<p>Die Koalition würde laut Umfragen auf ${koalitionPercentage.toFixed(1)}% der Sitze kommen</p>
		<p>Die Aussagen der Parteien passen wie folgt zu der errechneten Koalitionsaussage:</p>`

		WOMT_aParteienLogos[koalitionPartyIndex][0]=convertLogoToDataURI(generateLogo(koalition))

		addStylesForColoredResultBars(koalition, koalitionPartyIndex, percentageShare);

		for (let thesenIndex = 0; thesenIndex<WOMT_nThesen; thesenIndex++) {
			WOMT_aThesenParteien[thesenIndex][koalitionPartyIndex]= koalitionThesen[thesenIndex];
			WOMT_aThesenParteienText[thesenIndex][koalitionPartyIndex] = [];
		
			const degree = 180 - (koalitionThesen[thesenIndex] + 1) * 90
		
			WOMT_aThesenParteienText[thesenIndex][koalitionPartyIndex][S_nSprache] = `Errechneter Wert: Die Koalition stimmt der These zu ${((koalitionThesen[thesenIndex] + 1)/2 * 100).toFixed(1)}% zu <span style="transform: rotate(${degree}deg); display: inline-block;">👍</span>`;
		}


		S_aThesen = transpose(WOMT_aThesenParteien)[koalitionPartyIndex];

		for (let i = 0; i < koalition.parties.length; i++) {
			original_calculate();

			const partyName = koalition.parties[i];
			const partyIndex = findPartyIndexByName(partyName);

			const percentage = S_aParteienDistances[partyIndex] * 100

			const color = colorMap[partyName];

			WOMT_aParteienBeschreibung[koalitionPartyIndex][S_nSprache] += `
            <div class="results__value" aria-hidden="true">
                <div class="results__bar-wrapper" aria-hidden="true">
                    <div class="results__bar koalitionBar koalitionBar-${partyIndex+1}" data-percentage="${percentage.toFixed(1)}" style="background-color: ${color}; background-image: unset; width: ${percentage.toFixed(1)}%;"></div>
                </div>
                <p class="results__percentage" style="font-size: calc(30/var(--font-size)*1rem); line-height: initial; margin: 0;" data-percentage="${percentage.toFixed(1)}">${percentage.toFixed(1)} %</p>
            </div>`;
		}

		WOMT_aParteienBeschreibung[koalitionPartyIndex][S_nSprache] += `
		<div style="text-align: right;max-height: 10px;">
            <span style="font-size: x-small;">
				${koalitionPercentage.toFixed(1)}%
                Auf Basis der <a target="_blank" href="${seatsDataFrom}" style="text-decoration: underline;">Daten vom ${seatsDataDate}</a>
            </span>
        </div>`;

	}

	/*
	* Farben!
	*/
	const customStyle = document.createElement('style');
	customStyle.innerHTML = `
		.koalitionBar:after {
			font-size: smaller;
			float: right;
			margin-top: -2px;
			margin-right: 1em;
			color: white;
			text-shadow: 1px 0px 1px #cccccc, 0px 1px 1px #111111, 2px 1px 1px #cccccc, 1px 2px 1px #111111, 3px 2px 1px #cccccc, 2px 3px 1px #111111;
		}
	`;
	document.head.appendChild(customStyle);

	for (let index=0; index< WOMT_nParteien; index++) {
		const partyName = WOM.getParty(index).getName(true);
		const color = colorMap[partyName];
		if (color) {
			const customStyle = document.createElement('style');
			customStyle.innerHTML = `#results-li-${index+1} .results__bar { background-color: ${color}; } .koalitionBar-${index+1}:after { content: '${partyName}'}`;
			document.head.appendChild(customStyle);
		} else {
			const customStyle = document.createElement('style');
			customStyle.innerHTML = `#results-li-${index+1} .results__bar { background-color: rgb(111,111,111) } .koalitionBar-${index+1}:after { content: '${partyName}'}`;
			document.head.appendChild(customStyle);
		}
	}



})();