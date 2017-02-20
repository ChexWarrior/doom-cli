const http = require('http');
const argv = require('minimist')(process.argv.slice(2));
const Promise = require('promise');
const apiHost = 'www.doomworld.com';
const apiPath = '/idgames/api/api.php';

// contains hosts of Doomworld idgames mirrors
const mirrors = {
  'idaho': 'ftp://mirrors.syringanetworks.net/',
  'greece': 'http://ftp.ntua.gr/pub/vendors/',
  'texas': 'http://ftp.mancubus.net/pub/',
  'germany': 'https://www.quaddicted.com/files/',
  'new york': 'http://youfailit.net/pub/',
  'virginia': 'http://www.gamers.org/pub/'
}

function formatResults(results) {
  //console.dir(results);
  let formattedResults = [];
  let flattenedResults = results.content.file; 

  // place single result into array for easier processing
  if(flattenedResults.constructor !== Array) {
    flattenedResults = [ results.content.file ]  
  } 
  
  flattenedResults.forEach((result) => {
    formattedResults.push({
      'title': result.title,
      'author': result.author,
      'url': result.idgamesurl
    });
  });
  
  console.dir(formattedResults);
}

function handleError(error) {
  console.log(`Error: ${error}`);
}

function handleArgs(args) {
  let finalArgs = {};
  let searchText = args._ || false;
   
  finalArgs.type = args.type || 'filename';

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
const apiAction = `?action=search&out=json&type=${searchArgs.type}&query=${searchArgs.query}`;
makeRequest(apiAction, apiHost, apiPath).then(formatResults, handleError);

