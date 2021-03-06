const request = require('request');
const argv = require('minimist')(process.argv.slice(2));
const readline = require('readline');
const fs = require('fs');
const Promise = require('promise');
const apiEndpoint = 'https://www.doomworld.com/idgames/api/api.php';

// TODO: Include ftp mirrors
// contains hosts of Doomworld idgames mirrors
const mirrors = {
  'greece': 'http://ftp.ntua.gr/pub/vendors/idgames/',
  'texas': 'http://ftp.mancubus.net/pub/idgames/',
  'germany': 'https://www.quaddicted.com/files/idgames/',
  'new york': 'http://youfailit.net/pub/idgames/',
  'virginia': 'http://www.gamers.org/pub/idgames/'
};

function handleDownload(result, args) {
  let file = fs.createWriteStream(`${result.filename}`);
  let chosenMirror = args.mirror;
  let downloadUrl = result.url.replace('idgames://', mirrors[chosenMirror]);
  
  console.log(`\nDownloading ${result.filename}@${downloadUrl}...`);
  
  let downloadRequest = request(downloadUrl)
    .pipe(file)
    .on('error', (error) => {
      console.dir(error);
    })
    .on('close', () => {
      console.log('Download complete!');
    });
}

function handleUserInput(response) {
  const results = response.results;

  if(results.length === 1 && response.args.autoDownload) {
    handleDownload(results[0], response.args);
  } else {
    let answer = '';
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    let promptForID = () => {
      rl.question('Enter (ID) of item to download: ', (input) => {
        answer = parseInt(input, 10);

        // TODO: Add extra options like exiting
        if(/[^0-9]/.test(answer) || answer <= 0 || answer > results.length) {
          console.log('Please enter a valid ID');
          promptForID();
        } else {
          rl.close();
          handleDownload(results[answer - 1], response.args);
        }
      });
    };

    promptForID();
  }
}

function displayResults(response) {
  let results = response.results;
  const numResults = results.length;

  console.log(`\nSEARCH RESULTS (Total: ${numResults})`);
  console.log('---------------------------');

  results.forEach((result) => {
    console.log(`(${result.id}) ${result.title} - ${result.author}`);
  });

  return {
    results: results,
    args: response.args
  };
}

function parseResults(response) {
  let parsedResults = [];
  let flattenedResults = response.results.content 
                       ? response.results.content.file 
                       : false; 
  let resultCount = 0;

  if(!flattenedResults) {
    console.log('No results!');
    process.exit(0);
  }

  //TODO: Add message when results are cut off (see API notes)
  // place single result into array for easier processing
  if(flattenedResults.constructor !== Array) {
    flattenedResults = [ flattenedResults ]  
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

  return { 
    results: parsedResults,
    args: response.args
  };
}

function handleError(error) {
  console.log(`Error: ${error}`);
}

function handleArgs(args) {
  let finalArgs = {};
  let searchText = args._ || false;

  finalArgs.showHelp = args.help || args.h || false;

  if(finalArgs.showHelp) {
    console.log(`doom-cli [-htm] search terms
      -h, --help: Show this help text
      -t, --type: Type of search. Can be filename, title, author, email, description, credits, editors or textfile. Defaults to filename.
      -m, --mirror: IdGames mirror from which to download files. Can be one of the following: germany, greece, texas, new york or virginia. Defaults to new york.
      -d, --download: By default doom-cli will automatically download a file if there is only one search result. Setting this to false will stop thise behavior. Defaults to true.
    `);
    process.exit(0);
  }

  finalArgs.mirror = args.mirror || args.m || 'new york';
  finalArgs.mirror = finalArgs.mirror.toLowerCase();
  finalArgs.type = args.type || args.t || 'filename';
  finalArgs.autoDownload = args.download || args.d || true;

  // join all positional args together to form search string
  if(searchText) {
    finalArgs.query = searchText.join(' ');
  } else {
    return false;
  }

  return finalArgs;
}

function makeRequest(uri, args) {
  return new Promise(function (resolve, reject) {
    request.get(uri, (error, response, body) => {
      if(error) {
        reject(error.message);
      } else {
        resolve({ 
          results: JSON.parse(body),
          args: args
        });
      }
    });
  });
}

const searchArgs = handleArgs(argv);
const apiAction = `${apiEndpoint}?action=search&out=json&type=${searchArgs.type}&query=${encodeURIComponent(searchArgs.query)}`;

makeRequest(apiAction, searchArgs)
  .then(parseResults, handleError)
  .then(displayResults, handleError)
  .then(handleUserInput, handleError);