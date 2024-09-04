/* This file uses functions from the util.js file */

function chunkArray(arr, size)
{
	return arr.length > size && arr.length > 0
			? [arr.slice(0, size), ...chunkArray(arr.slice(size), size)]
			: [arr];
}
  
function windowArray(inputArray, size)
{ 
  return inputArray
    .reduce((acc, _, index, arr) => {
      if (index+size > arr.length) {
        //we've reached the maximum number of windows, so don't add any more
        return acc;
      }
      
      //add a new window of [currentItem, maxWindowSizeItem)
      return acc.concat(
        //wrap in extra array, otherwise .concat flattens it
        [arr.slice(index, index+size)]
      );
      
    }, []);
}

function append(arr, x)
{
	return arr.concat([x]);
}

function compose(...functions)
{
	return (input) =>
	{
		return functions.reduceRight((acc, fn) => { return fn(acc); }, input);
	};
};

function getUnicodeWithOffset(startUnicodeCharacter, offset)
{
    const parse = startUnicodeCharacter.charCodeAt(0);
    const add = parse + parseInt(offset);
    const reParse = String.fromCharCode(add);
    return reParse;
}

//range: [1, max]
function getCryptoStrongRandomInt(max)
{
    const randomBuffer = new Uint32Array(1);

    window.crypto.getRandomValues(randomBuffer);

    const randomNumber = randomBuffer[0] / (0xffffffff + 1);
    const result = Math.floor(randomNumber * max) + 1;
	
	return result;
}

//range: [min, max]
function getCryptoStrongRandomIntRange(min, max)
{
    const randomBuffer = new Uint32Array(1);

    window.crypto.getRandomValues(randomBuffer);

    const randomNumber = randomBuffer[0] / (0xffffffff + min);
    const result = Math.floor(randomNumber * max) + min;
	
	return result;
}

//this generates div-mod decompositions of an "exponent complete" number (2^2, 3^3, 4^4, etc...)
//decomposition algorithm example (for 4^4)
//mod 4^4, then div 4^3 = size (NOTE: this has the effect of just doing the division)
//mod 4^3, then div 4^2 = color
//mod 4^2, then div 4^1 = alphabet system
//mod 4^1, then div 4^0 = symbols (mod) (NOTE: this has the effect of just doing the mod)
//TODO: this implies all decomposed numbers are uniform! Simulate this to test it out (compared to fully composed nubmers)
function decompose(rng, n)
{
	return [...Array(n)].map((x, i) => integerDivide((rng % (n ** (i + 1))), n**i));
}

// executeShuffle -- function that composes domain logic into a workflow that produces html content.
//shuffler: l => [n], where [n] is of length, "l", and n is a number in algorithm range
//transformer: n => str, where n is a randomly generated number in range, and str contains pre-printed string values (for example, if algorithm uses numbers and colors, str may be '1r', etc 
//htmlElementFactory: str => divContent, takes the pre-print string and creates html that will be put inside the shuffle div
function createShuffle(shuffler, transformer, htmlElementFactory) 
{
	const randomRaws = shuffler(10);
	
	const transformed = randomRaws.map(transformer).reduce((f, s) => `${f}${s}`);
	
	const shuffleContent = htmlElementFactory(transformed)
	
	return shuffleContent;
}

//event handler
//algorithmName = name of shuffle algorithm to use... low budget strategy pattern...
function onShuffleClick(algorithmName)
{
	document.getElementById("algorithm").innerHTML = algorithmName;

	let shuffleContent = '###-###-####';
	let shuffleDocs = '';
	
	//criteria:
	//	4 sizes
	//	4 symbols (assuming alphanumeric order -- abcde, 12345, etc)
	//	4 colors (#ff0000, #00ff00, #0000ff, #87cefa)
	//	4 alphabet systems (numbers, lowercase, uppercase, greek (lower))
	if (algorithmName == '2dQuartic')
	{
		shuffleDocs = 'greek alphabet: alpha, beta, gamma, delta, epsilon\n'
					  + 'display set order: numbers, lowercase, uppercase, greek\n'
					  + '  POSTSHUFFLE: roll 4 piles * 3 choices = 4! = d24 (or some combination), then decompose result: mod 4, mod 3, then mod 2';
					  
		function stringify(decomposition)
		{
			return decomposition.reduce((f, s) => f + `${s}`, '');
		}
		
		function decoratePrePrint(prePrint)
		{
			//size function
			function toSize(n)
			{
				//we know that, for sizes of 3, we want 500% size
				const baseValue = 2;
				const baseSize = 500;
				const sizeValueRatio = baseSize / 2;
				
				//thus, can extrapolate to other sizes
				const nSize = (parseInt(n) + 1) * sizeValueRatio;
				
				return nSize;
			}
			
			//color function -- this happens in span styling, so outputs something readable as a style
			//fourth color: '#87cefa' creates the most distinct set, but #000000 may be more intuitive to sort by
			function toColor(n)
			{
				const colorSet = ['#ff0000', '#00ff00', '#0000ff', '#000000'];
				return colorSet[n];
			}
			
			//alphabet system function -- maybe try a char offset?
			function toCharOffset(n)
			{
				//numbers, lowercase, uppercase, greek (lower)
				//numbers: U+0031
				//lowercase low alphabet: U+0061
				//capital low alphabet: U+0041
				//greek: U+03B1
				const offsets = ['\u{0031}', '\u{0061}', '\u{0041}', '\u{03B1}'];
				return offsets[n];
			}
			
			//symbol function -- this should be combined with offset to get the actual symbol shown
			function toSymbolOffset(n)
			{
				return n;
			}
			
			//the main span creation func -- utilizes the utility functions above
			function createSpan(sizePercent, color, alphabetOffset, symbolOffset)
			{
				const style = `style="font-size: ${sizePercent}%; color: ${color};"`;
				const symbol = `${getUnicodeWithOffset(alphabetOffset, parseInt(symbolOffset))}`;
				const result = '<span ' + style + '>' + symbol + '</span>';
				
				return result;
			}
			
			return chunkArray(prePrint, 4)
					.reduce((f, s) => 
								f + createSpan(toSize(s[0]), toColor(s[1]), toCharOffset(s[2]), toSymbolOffset(s[3])),
							'');
		}
		
		shuffleContent = 
			createShuffle(
				l => [...Array(l)].map(x => getCryptoStrongRandomInt(4 ** 4)),
				compose(stringify, rng => decompose(rng, 4)),
				decoratePrePrint);
		
	}
	//colored cubic -- creates a random string of RGB colored characters, each of which represent the pile locations of 3 cards
	//	mod 9, then div 3 = first card's pile
	//	mod 3 is second card's pile
	//	div 9 = color = 3rd card's pile) 
	else if (algorithmName == 'coloredCubic') 
	{
		//some of colored cubic definition goes here -- should probably extract this somewhere else later
		shuffleDocs = 'coloredCubic is a pile-shuffling algorithm that produces 10-character random strings.\n'
					  + 'Each character represents the pile of 3 cards (may choose any order):\n'
					  + '  - One card is put into a pile by taking the size of the character {small, medium, large} \n'
					  + '  - The second card is put into a pile by taking the value of the number {1, 2, 3}\n'
					  + '  - The third card is put into a pile by taking the coolness of the color {red, green, blue}\n'
					  + '  NOTE: an easier way may be to do all of the sizes, then the mods, then the colors\n'
					  + '  POSTSHUFFLE: roll 3 piles * 2 choices = 3! = d6, mod 3, mod 2';
	
		function toColorSpan(n)
		{
			return `${n % 9}${integerDivide(n, 9)}`
		}
		
		function decoratePrePrint(prePrint)
		{
			function createSpan(color, number, sizePercent)
			{
				const span = '<span ' + `style="font-size: ${sizePercent}%; color: ${color};">${number}` + '</span>';
				
				return span;
			}
			
			function toModularValue(n)
			{
				return n % 3;
			}
			
			function toColor(c)
			{
				if (c == 0) { return 'red'; }
				if (c == 1) { return 'green'; }
				return 'blue';
			}
			
			function toSize(n)
			{
				//we know that, for sizes of 2, we want 250% size
				const maxSize = 1000;
				const maxValue = 3;
				const sizeValueRatio = maxSize / maxValue;
				
				//thus, can extrapolate to other sizes
				const nValue = integerDivide(parseInt(n), 3) + 1; //n should be at most 8 => we should get 1, 2, or 3 here 
				const nSize = nValue * sizeValueRatio;
				
				return nSize;
			}
			
			function parsePair(pair)
			{
				const val =
					{ number: toModularValue(parseInt(pair[0])),
					  color: toColor(parseInt(pair[1])),
					  size: toSize(pair[0])
					}; 
					
				return val;
			}
			
			return chunkArray(prePrint, 2)
					.map(parsePair)
					.map((x, i) => [x, i])
					.reduce((f, s) => f + createSpan(s[0].color, s[0].number + 1, s[0].size),
							'');
		}
		
		shuffleContent = 
			createShuffle(
				l => [...Array(l)].map(x => getCryptoStrongRandomInt(3**3)), //3^3 = 27, which is necessary to generate all possible colored values
				toColorSpan,
				decoratePrePrint);
	}
	else //catch-all error case. used if algorithm wasn't recognized
	{
		alert(`ERROR -- ${algorithmName} not a recognized algorithmName`);
		shuffleContent = "###-###-####";
	}
	
	document.getElementById("shuffle").innerHTML = shuffleContent;
	document.getElementById("algorithmDocs").innerText = shuffleDocs;
}


function onFunPrepClick(algorithmName)
{
	document.getElementById("algorithm").innerHTML = algorithmName;
	
	let shuffleContent = '###-###-####';
	let shuffleDocs = '';
	
	let shuffle = [];
	
	if (algorithmName == 'fun8')
	{
		shuffleDocs = 'fun8 seeks to eliminate bad shuffle possibilities by observing a few facts:\n'
					  + 'shuffle quality is more sensitive in general to early cards than later cards (imagine drawing no land/only land for the first 5 turns)\n'
					  + 'bad shuffles (too much or too little land) creates uninteractive gameplay (AKA boring)\n'
					  + 'land sufficiency is generally of paramount importance until a certain point, then its value drops significantly (imagine not being able to get enough land for your commander/medium-value cards)\n'
					  + 'thus, fun8 seeks to ensure some minimal constraints are met in terms of land-amount (not too much or too little), while maximizing randomness where possible\n'
					  + 'the specific constraints are as follows:\n'
					  + '1) the top 8 cards, as a whole, should contain 3 lands (making a discard-heavy early game unlikely, while not overly-accelerating power)\n'
					  + 'NOTE: this algorithm only guarantees 3 land, so bad early shuffles are still possible (although the shuffle is much more natural-seeming) -- use fun13 to eliminate this possibility as well. \n'
					  + 'INSTRUCTIONS:\n'
					  + '1): split land/nonland (can also add land-giving sorcery, at your own risk) into two separate piles. Shuffle these two decks, as desired.\n'
					  + '2): use the shuffle generated above to generate the shuffle for the first 8 cards. N = take the top card of the nonland-deck, L = take the top card of the land deck. These should go into one pile -- these will be your first 8 cards\n'
					  + '3): combine the remaining land/nonland decks, then shuffle them as desired\n'
					  + '4): put the big shuffled deck BEHIND the first 8 shuffled cards, such that the cards from the big deck will only be drawn AFTER the ones from the first 8\n'
					  + '5): play the game as normal';
					  
		//top 8 is 1-3
		const top8Randoms = 3;
		
		//for 3:
		//8*7*6 = 336 (top 3 numbers of 8!, for 3 positions in 8 locations)
		//if result = 336, 336 mod 8 = 0, mod 7 = 0, mod 6 = 0, so we put each land in the first spots
		//if result = 1, 0 mod 8 = 8, mod 7 = 7, mod 6 = 6, so we'd put it in the last spot each time
		
		//we have how many of the top 8 should be land -- now, we need to actually generate a shuffle from that
		//generate shuffle of positions of the land cards (via familiar decomp rand process)
		//then, create array with 8 chars, each init'd to 'N'. each decomposed land location replaces with 'L'
		
		//adjustment = 8!/x => adjustment = 8! / (8^n * (8-n)!)
		function factorial(n)
		{
			let result = 1;
			
			for (let i = n; i > 1; i--) { result *= i; }
			
			return result;
		}
		
		const lowerFactorial = factorial(8 - top8Randoms);
		const adjustment = factorial(8) / (8**top8Randoms * lowerFactorial);
		const adjusted = 8**top8Randoms * adjustment;
		const top8LandPositionShuffle = getCryptoStrongRandomInt(adjusted);
		
		const top8LandPositions = 
			[...Array(top8Randoms)].map((x, i) => top8LandPositionShuffle % (8-i));
		
		//good luck reading this in the future...
		//this takes the mod indices and converts them into absolute indices, ready to be placed into an 8-length array
		const top8LandAbsoluteIndices =
			top8LandPositions
				.reduce(
					(info, nextIndex) =>
						append(
							info,
							[...Array(8).keys()]
								.filter(x => !info.includes(x)) //filter down ones that don't match previously found
								.map((pair, j) => [pair, j]) //track indices in new range
								.find(x => x[1] == nextIndex) //an index is said to be a match if it matches the indices in the new range
								[0]), //choose the 0th index because that is where the absolute index is contained
					[]);
		
		//this breaks down shuffle into false (nonlands) and true (lands)
		const top8Shuffle =
			[...Array(8).keys()].map(i => top8LandAbsoluteIndices.includes(i) ? true : false);
			
		shuffle = top8Shuffle;
	}
	else if (algorithmName = 'fun13')
	{
		shuffleDocs = 'UNDER CONSTRUCTION -- DO NOT USE\n';
					  
		//top 8 is 1-3
		const top8Randoms = getCryptoStrongRandomInt(3);
		
		console.log(`top8Randoms = ${top8Randoms}`);
		//for 3:
		//8*7*6 = 336 (top 3 numbers of 8!, for 3 positions in 8 locations)
		//if result = 336, 336 mod 8 = 0, mod 7 = 0, mod 6 = 0, so we put each land in the first spots
		//if result = 1, 0 mod 8 = 8, mod 7 = 7, mod 6 = 6, so we'd put it in the last spot each time
		
		//we have how many of the top 8 should be land -- now, we need to actually generate a shuffle from that
		//generate shuffle of positions of the land cards (via familiar decomp rand process)
		//then, create array with 8 chars, each init'd to 'N'. each decomposed land location replaces with 'L'
		
		//adjustment = 8!/x => adjustment = 8! / (8^n * (8-n)!)
		function factorial(n)
		{
			let result = 1;
			
			for (let i = n; i > 1; i--) { result *= i; }
			
			return result;
		}
		
		
		const lowerFactorial = factorial(8 - top8Randoms);
		const adjustment = factorial(8) / (8**top8Randoms * lowerFactorial);
		const adjusted = 8**top8Randoms * adjustment;
		const top8LandPositionShuffle = getCryptoStrongRandomInt(adjusted);
		
		console.log(`top8LandPositionShuffle = ${top8LandPositionShuffle}`);
		
		const top8LandPositions = 
			[...Array(top8Randoms)].map((x, i) => top8LandPositionShuffle % (8-i));
		
		console.log(`top8LandPositions = ${top8LandPositions}`);
		
		//good luck reading this in the future...
		//this takes the mod indices and converts them into absolute indices, ready to be placed into an 8-length array
		const top8LandAbsoluteIndices =
			top8LandPositions
				.reduce(
					(info, nextIndex) =>
						append(
							info,
							[...Array(8).keys()]
								.filter(x => !info.includes(x)) //filter down ones that don't match previously found
								.map((pair, j) => [pair, j]) //track indices in new range
								.find(x => x[1] == nextIndex) //an index is said to be a match if it matches the indices in the new range
								[0]), //choose the 0th index because that is where the absolute index is contained
					[]);
		
		console.log(`top8LandAbsoluteIndices = ${top8LandAbsoluteIndices}`);
		
		//this breaks down shuffle into false (nonlands) and true (lands)
		const top8Shuffle =
			[...Array(8).keys()].map(i => top8LandAbsoluteIndices.includes(i) ? true : false);
			
		console.log(`top8Shuffle = ${top8Shuffle}`);
		
		let nextTwo = [undefined, undefined];
		
		if (top8Randoms == 1) { nextTwo = [true, true]; } //if there was only 1 land in the top 8, we'd need 9 and 10 to both be land to preserve shuffle quality
		else if (top8Randoms == 3) { nextTwo = [false, false]; } //if there were 3 lands in the top 8, we have enough for a full 10, so just do nonland for the rest
		else if (top8Randoms == 2)
		{
			const pos = getCryptoStrongRandomInt(2);
			
			nextTwo = [false, false].map((x, i) => pos == i + 1 ? true : x);
		} //here, we want exactly 1 more land. However, its position should be random
		
		const top10Shuffle = top8Shuffle.concat(nextTwo);
		
		console.log(`top10Shuffle = ${top10Shuffle}`);
		
		//potential top 9/10 is another 1-2
		shuffle = top10Shuffle;
	}
	else //catch-all error case. used if algorithm wasn't recognized
	{
		alert(`ERROR -- ${algorithmName} not a recognized algorithmName`);
		shuffleContent = "###-###-####";
	}
	
	//create an html element that will be how the land/nonland status is displayed
	function decorateShuffle(isLand)
	{
		const color = isLand ? '#00ff00' : '#000000';
		const displayChar = isLand ? 'L' : 'N';
		
		const span = '<span ' + `style="font-size: ${750}%; color: ${color};">${displayChar}` + '</span>';
				
		return span;
	}
	
	const shuffleSpans = shuffle.map(decorateShuffle).reduce((f, s) => f + s);
	
	document.getElementById("shuffle").innerHTML = shuffleSpans;
	document.getElementById("algorithmDocs").innerText = shuffleDocs;
}

console.log('mtg functions loaded');
