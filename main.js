const http = require('http');
const argv = require('minimist')(process.argv.slice(2));
const Promise = require('promise');
const apiHost = 'www.doomworld.com';
const apiPath = '/idgames/api/api.php';

function formatResults(results) {
  console.dir(results);
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
        resolve(result);
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