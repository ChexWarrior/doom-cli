const request = require('request');
const argv = require('minimist')(process.argv.slice(2));
const readline = require('readline');
const fs = require('fs');
const Promise = require('promise');
const apiEndpoint = 'https://www.doomworld.com/idgames/api/api.php';

// contains hosts of Doomworld idgames mirrors
const mirrors = {
  'idaho': 'ftp://mirrors.syringanetworks.net/',
  'greece': 'http://ftp.ntua.gr/pub/vendors/',
  'texas': 'http://ftp.mancubus.net/pub/',
  'germany': 'https://www.quaddicted.com/files/',
  'new york': 'http://youfailit.net/pub/idgames/',
  'virginia': 'http://www.gamers.org/pub/'
};

function handleDownload(result) {
  let file = fs.createWriteStream(`${result.filename}`);
  let downloadUrl = result.url.replace('idgames://', mirrors['new york']);
  let downloadRequest = request(downloadUrl)
    .pipe(file)
    .on('error', (error) => {
      console.dir(error);
    })
    .on('close', () => {
      console.log('Download complete!');
    });
}

function handleUserInput(results) {
  let answer = '';
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  let promptForID = () => {
    rl.question('Enter (ID) of item to download: ', (input) => {
      answer = parseInt(input, 10);

      if(/[^0-9]/.test(answer) || answer <= 0 || answer > results.length) {
        console.log('Please enter a valid ID');
        promptForID();
      } else {
        rl.close();
        handleDownload(results[answer - 1]);
      }
    });
  };

  promptForID();
}

function displayResults(results) {    
  console.log(`\nSEARCH RESULTS (Total: ${results.length})`);
  console.log('---------------------------');

  results.forEach((result) => {
    console.log(`(${result.id}) ${result.title} - ${result.author}`);
  });

  return results;
}

function parseResults(results) {
  let parsedResults = [];
  let flattenedResults = results.content.file; 
  let resultCount = 0;

  //TODO: Add message when results are cut off (see API notes)
  //TODO: Handle no results
  // place single result into array for easier processing
  if(flattenedResults.constructor !== Array) {
    flattenedResults = [ results.content.file ]  
  }

  flattenedResults.forEach((result) => {
    resultCount += 1;
    parsedResults.push({
      id: resultCount,
      title: result.title,
      author: result.author,
      filename: result.filename,
      url: result.idgamesurl
    });
  });

  return parsedResults;
}

function handleError(error) {
  console.log(`Error: ${error}`);
}

function handleArgs(args) {
  let finalArgs = {};
  let searchText = args._ || false;   
  finalArgs.type = args.type || args.t || 'filename';

  // join all positional args together to form search string
  if(searchText) {
    finalArgs.query = searchText.join(' ');
  } else {
    return false;
  }

  return finalArgs;
}

function makeRequest(action, host, path) {
  return new Promise(function (resolve, reject) {
    const requestOptions = {
      host: host,
      path: path + action
    };

    let request = http.request(requestOptions, (response) => {
      var result = '';
      
      response.on('data', (data) => {
        result += data;
      });

      response.on('end', () => {
        resolve(JSON.parse(result));
      });

      response.on('error', (error) => {
        reject(error.message);
      });
    }).end();
  });
}

const searchArgs = handleArgs(argv);
const apiAction = `?action=search&out=json&type=${searchArgs.type}&query=${encodeURIComponent(searchArgs.query)}`;
let results = [];

makeRequest(apiAction, apiHost, apiPath)
  .then(parseResults, handleError)
  .then(displayResults, handleError)
  .then(handleUserInput, handleError);