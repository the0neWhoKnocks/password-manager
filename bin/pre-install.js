const { engines } = require('../package.json');

const engine = (process.env.npm_execpath.includes('yarn')) ? 'yarn' : 'node';
const engineVer = engines[engine];

// NOTE - uncomment the below to test different cases.
// const engineVer = '<10.14.2';
// const engineVer = '<=10.14.2';
// const engineVer = '>10.14.2';
// const engineVer = '>=10.14.2';
// const engineVer = '=10.14.2';
// const engineVer = '10.14.2';

const verToNum = ver => ver.split('.').join('');

if (engineVer) {
  const parts = engineVer.match(/^([<>=])?(=)?([\d.]+)$/);
  
  if (parts) {
    const operator = `${parts[1] || ''}${parts[2] || ''}` || '=';
    const rawEngineVer = parts[3];
    const rawCurrVer = process.version.replace('v', '');
    const engineVer = verToNum(rawEngineVer);
    const currVer = verToNum(rawCurrVer);
    let verAcceptable = false;
    let operatorDesc = '';
    
    switch (operator) {
      case '<': 
        if (currVer < engineVer) verAcceptable = true;
        else operatorDesc = 'less than';
        break;
        
      case '<=': 
        if (currVer <= engineVer) verAcceptable = true;
        else operatorDesc = 'less than or equal to';
        break;
        
      case '>': 
        if (currVer > engineVer) verAcceptable = true;
        else operatorDesc = 'greater than';
        break;
        
      case '>=': 
        if (currVer >= engineVer) verAcceptable = true;
        else operatorDesc = 'greater than or equal to';
        break;
        
      default: 
        if (currVer === engineVer) verAcceptable = true;
        else operatorDesc = 'equal to';
        break;
    }
    
    if (!verAcceptable) {
      console.log(`Your current ${engine} version "${rawCurrVer}" is not ${operatorDesc} the required verion "${rawEngineVer}"\n`);
      process.exit(1);
    }
  }
}
