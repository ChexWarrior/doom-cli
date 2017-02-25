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
  'virginia': 'http://www.gamers.org/pub/idgames/'
};

function handleDownload(result, args) {
  let file = fs.createWriteStream(`${result.filename}`);
  let mirror = args.mirror;
  let downloadUrl = result.url.replace('idgames://', mirrors[mirror]);
  console.log(`Downloading ${result.filename}@${downloadUrl}...`);
  
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
        handleDownload(results[answer - 1], searchArgs);
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
  let flattenedResults = results.content ? results.content.file : false; 
  let resultCount = 0;

  if(!flattenedResults) {
    console.log('No results!');
    process.exit(0);
  }

  //TODO: Add message when results are cut off (see API notes)
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

  finalArgs.showHelp = args.help || args.h || false;

  if(finalArgs.showHelp) {
    console.log(`doom-cli [optional args] search terms \n-h, --help: Show this help text \n-t, --type: Type of search. Can be filename, title, author, email, description, credits, editors or textfile. Defaults to filename. \n-m, --mirror: IdGames mirror from which to download files. Defaults to New York.`);
    process.exit(0);
  }

  finalArgs.mirror = args.mirror || args.m || 'new york';
  finalArgs.mirror = finalArgs.mirror.toLowerCase();
  finalArgs.type = args.type || args.t || 'filename';

  // join all positional args together to form search string
  if(searchText) {
    finalArgs.query = searchText.join(' ');
  } else {
    return false;
  }

  return finalArgs;
}

function makeRequest(uri) {
  return new Promise(function (resolve, reject) {
    request.get(uri, (error, response, body) => {
      if(error) {
        reject(error.message);
      } else {
        resolve(JSON.parse(body));
      }
    });
  });
}

const searchArgs = handleArgs(argv);
const apiAction = `?action=search&out=json&type=${searchArgs.type}&query=${encodeURIComponent(searchArgs.query)}`;

makeRequest(apiEndpoint + apiAction)
  .then(parseResults, handleError)
  .then(displayResults, handleError)
  .then(handleUserInput, handleError);