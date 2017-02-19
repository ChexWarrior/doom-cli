const http = require('http');
//const argv = require('minimist');

const apiHost = 'www.doomworld.com';
const apiPath = '/idgames/api/api.php';
const apiAction = '?action=ping&out=json';

const options = {
  host: apiHost,
  path: apiPath + apiAction
};

var request = http.request(options, (response) => {
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
