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

const searchArgs = handleArgs(argv);
const apiAction = `?action=search&out=json&type=${searchArgs.type}&query=${searchArgs.query}`;
const requestOptions = {
  host: apiHost,
  path: apiPath + apiAction
};

let request = http.request(requestOptions, (response) => {
  var responseData = '';
  
  response.on('data', (data) => {
    responseData += data;
  });

  response.on('end', () => {
    console.log(responseData);
  });

  response.on('error', (error) => {
    console.log(`Error: ${error.message}`);
  });
}).end();

