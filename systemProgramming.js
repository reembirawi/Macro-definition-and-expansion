const fs = require('fs');   

// data structure and varialbles
const inputFileName = 'macroFile.txt';
const outputFileName = 'expansionFile.txt';
let EXPANDING;
let startPointer;
let endPointer;
let DefstartPointer;
let DefendPointer;
let currentLineIndex = 0;
let index = 0;
let argTab = [];
let NAMTAB = {};
let DEFTAB = []; 
let defineProcess;
let inputLines = []; 
let level;
let counter = 'AA';
let idx1 = 0, idx2 = 0;
let counterArray = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M' , 'N', 'O', 
  'P', 'Q', 'R','S', 'T', 'U' ,'V', 'W', 'X','Y','Z','1','2','3','4','5','6','7','8','9'];
// end of data structure and varialbles


// Function to initialize the file reader and format lines
const initializeFileReader = () => {
    fs.writeFile(outputFileName, '', function(){console.log('')})
    try { 
        const fileContent = fs.readFileSync(inputFileName, 'utf8');
        inputLines = fileContent
            .split('\n')
            .map(line => { 
                const parts = line.split(/\s+/);  
                return [
                    parts[0] || '',  
                    parts[1] || '', 
                    parts[2] || '',  
                ];
            });
            inputLines = inputLines.filter(line => { 
              return !(line[0] === '' && line[1] === '' && line[2] === '');
            });
    } catch (err) {
        console.error(`Error reading the file "${inputFileName}":`, err.message);
        process.exit(1); 
    }
};

// inner functions
const readLineFromInputFile = () => { 
  return inputLines[currentLineIndex++]; 
};
const search = (macroName) => {
  return NAMTAB.hasOwnProperty(macroName);
};
const enterMacroNameIntoNameTab = (macroName, keyWords) => {
  NAMTAB[macroName] = [0, 0, keyWords.length];
}
const writeIntoDefTab = (line) => {
  DEFTAB.push(line);
  return DEFTAB.length - 1;
};
const wirteToExpandedFile = (line) => {  
  if(line != undefined)
    fs.writeFileSync(outputFileName, line[0] + '\t' + line[1] + '\t'+ line[2] +'\n', { flag: 'a', encoding: 'utf8' });
};
const convertToComment = (invocationLine) => { 
  if(invocationLine[0] != '') {
    return ['.' + invocationLine[0],invocationLine[1],invocationLine[2]];
  } else {
    return [invocationLine[0],'.' + invocationLine[1], invocationLine[2]];
  } 
}
const replaceArgWithPositional = (line, keyWords) => {  
  let newLine = line[2];
  if(newLine != ''){
    for(let index = 0; index < keyWords.length; index++) {
      if(newLine.includes(keyWords[index]) && keyWords[index] != '') {
        newLine = newLine.replace(keyWords[index], `?${index + 1}`);
      } 
    }
  }

  const opcode = getOpecode(line);  
  if(opcode == "MEND") level--;
  if(opcode == "MACRO") level++; 
  return newLine;
}
const replacePositopnalNotation = (line) => {
  let newLine = line[2].split('').reduce((newLine, character) => {
    if(newLine.at(-1) == '?'){
      newLine.pop(); 
      newLine.push(argTab[Number(character) - 1]);
    }else{
      newLine.push(character);
    }  
    return newLine;
  },[]).join('');
  let newLine0 = line[0]; 
  if(newLine0.includes('$')){ 
    newLine0 = newLine0.replace('$','$' + increment(counter));
  }
  if(newLine.includes('$')){
    newLine = newLine.replace('$', '$' + increment(counter));
  }
  return [newLine0,line[1],newLine];
}
const increment = (counter) => {
  if(defineProcess) return '';
  if(counter[1] == '9') {
    idx2 = 0;
    return counter = counterArray[++idx1] + counterArray[idx2];
  }else {
    return counter = counterArray[idx1] + counterArray[idx2++];
  }
}
const comment = (line) => {
  return line[0][0] == '.' || line[1][0] == '.';
}
const getOpecode = (line) => {
  return line[1];
}
const convertToArray = (line) => {
  if(line[2] == '') return '';
  return line[2].split(',');
}
// end of inner functions

// begin {macro processor}
const macroProcessor = () => {
  EXPANDING = false;
  do {
    let line = getLine();  
    var opcode = getOpecode(line); 
    processLine(line); 
  } while(opcode != "END");
};
// end of macro processor

// processLine
const processLine = (line) => { 
  
  let opcode = getOpecode(line);   

  search(opcode)
  ? expand(line)
  : (opcode == "MACRO"
  ? define(line)
  : wirteToExpandedFile(line)); 
};
// end of processLine

// define
const define = (line) => { 
  defineProcess = true;
  let macroName = line[0];
  if (NAMTAB.hasOwnProperty(macroName)) {
     console.error(`Macro "${macroName}" is already defined.`);
  }
 
  DefstartPointer = writeIntoDefTab(['',line[0],line[2]]);
  DefendPointer = startPointer;
  let keyWords = convertToArray(line);  
  enterMacroNameIntoNameTab(macroName,keyWords); 

  level = 1;   
  while(level > 0) {
    let line = getLine(); 

    let newLine = comment(line) 
    ? line
    : replaceArgWithPositional(line, keyWords); 
     
    DefendPointer = writeIntoDefTab([line[0], line[1], newLine]);  
  } 

  NAMTAB[macroName][0] = DefstartPointer;
  NAMTAB[macroName][1] = DefendPointer; 
  defineProcess = false;
}
// end of define

// expand
const expand = (invocationLine) => { 
  EXPANDING = true;
  
  let macroName = invocationLine[1];
  startPointer = NAMTAB[macroName][0];
  endPointer = NAMTAB[macroName][1]; 
  index = startPointer; 

  getLine();
  argTab = convertToArray(invocationLine);  
  if(argTab.length != NAMTAB[macroName][2]) {
    console.error(`Error: Expected ${NAMTAB[macroName][2]} arguments, but got ${argTab.length}.`);
    process.exit(0);
  }
  wirteToExpandedFile(convertToComment(invocationLine));
   
  while(index < endPointer){ 
    let line = getLine();  
    processLine(line);  
  } 
  
  EXPANDING = false;
};
// end of expand

// getLine
const getLine = () => { 
  if(EXPANDING) { 
    return replacePositopnalNotation(DEFTAB[index++]);
  } else {
    return readLineFromInputFile();
  } 
};
// end of getLine

// Initialize the file reader and clear output file content
initializeFileReader();    

// maccro processor begin
macroProcessor();  

// end of the processor
console.log(`${outputFileName} is ready`);    