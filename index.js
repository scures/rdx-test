import axios from 'axios';
import fs from 'fs';

const fetchExtensions = async () => {
  console.log('💠 Fetching extension list...');
  const lastUpdate = JSON.parse(fs.readFileSync('extensions.json', 'utf8'))?.lastUpdate;

  // INFO: Fetch the extensions only if the last update was more than 24 hours ago
  if (!new Date() - new Date(lastUpdate) < 86400000) return

  let extensions = []

  const response = await fetchDockerHub("https://hub.docker.com/api/content/v1/products/search?page_size=25&page=1&q=&type=extension");


  if (response.next) {
    // Set a timeout of 2 seconds between requests
    await new Promise(resolve => setTimeout(resolve, 2000));

    const nextResponse = await fetchDockerHub(response.next);
    extensions = [...response.summaries, ...nextResponse.summaries];
  }

  fs.writeFile('extensions.json', JSON.stringify({
    lastUpdate: new Date(),
    extensions: extensions
  }, null, 2), (err) => {
    if (err) throw err;
    console.log('The file has been saved!');
  })

  console.log('✅ Done fetching extension list!');
}

const fetchExtensionDetails = async () => {
  console.log('💠 Fetching extension details...');

  // INFO: FOR TESTING PURPOSES, ONLY FETCH THE FIRST 3 EXTENSIONS
  const extensions = JSON.parse(fs.readFileSync('extensions.json', 'utf8'))?.extensions.slice(0, 3);

  const extensionDetails = [];

  for (const extension of extensions) {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const response = await fetchDockerHub(`https://hub.docker.com/v2/extensions/${extension.slug.replace('/', '_')}/metadata.json`);

    extensionDetails.push(response);
  }

  fs.writeFile('extensions-metadata.json', JSON.stringify({
    lastUpdate: new Date(),
    extensions: extensionDetails
  }, null, 2), (err) => {
    if (err) throw err;
    console.log('The file has been saved!');
  })

  console.log('✅ Done fetching extension details!');
}


/** Fetches the DockerHub API
 * There is a rate limit of 180 requests per hour
 * @param {*} endpoint
 */
const fetchDockerHub = async (endpoint) => {
  const {data} =  await axios({
    method: "GET",
    url:endpoint,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "search-version": "v3",
      "sec-gpc": "1",
    }
  })

  return data;
};

fetchExtensions();
fetchExtensionDetails();
