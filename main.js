const http = require('http');
const argv = require('minimist')(process.argv.slice(2));
const apiHost = 'www.doomworld.com';
const apiPath = '/idgames/api/api.php';

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
      console.log(result);
    });

    response.on('error', (error) => {
      console.log(`Error: ${error.message}`);
    });
  }).end();
}

const searchArgs = handleArgs(argv);
const apiAction = `?action=search&out=json&type=${searchArgs.type}&query=${searchArgs.query}`;

makeRequest(apiAction, apiHost, apiPath);
