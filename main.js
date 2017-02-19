const http = require('http');
const argv = require('minimist')(process.argv.slice(2));

const apiHost = 'www.doomworld.com';
const apiPath = '/idgames/api/api.php';

function handleArgs(args) {
  let searchText = args._;

  // join all positional args together to form search string
  if(searchText) {
    return searchText.join(' ');
  } else {
    return false;
  }
}

const searchText = handleArgs(argv);
const apiAction = `?action=search&out=json&type=title&query=${searchText}`;
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

