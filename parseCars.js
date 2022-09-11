const fs = require('fs');
const path = require('path');
const {partialFetch, handleAccessDenied} = require('./utils')
const {getFilledFolders} = require('./otherStaff')
const {parseCarPage} = require('./carPage')

async function parseCars({ brand, model, generation, path: pathToFile }, parsedCarsIds, browser) {
	const generationPath = path.join(__dirname, 'cars', brand, model, generation);
	fs.mkdirSync(generationPath, { recursive: true });
	const { cars, modelTitle, modelPreview } = JSON.parse(fs.readFileSync(pathToFile, 'utf8'));
	const generationMeta = { modelTitle, modelPreview };
	fs.writeFileSync(`${generationPath}/_meta.json`, JSON.stringify(generationMeta, null, 2));
	
	const carsNeedToParse = cars.filter(({ link }) => {
		const carId = link.replace(/\/$/, '').split('/').reverse()[0];
		return !parsedCarsIds.includes(carId);
	});
	return partialFetch(carsNeedToParse, async ({ link, preview }, index) => {
		return parseCar(link, generationPath, index, preview, browser);
	})
}

async function parseCar(link, generationPath, index, preview, browser) {
	const carId = link.replace(/\/$/, '').split('/').reverse()[0];
	const carFolder = `${index}_${carId}`;
	const carPath = `${generationPath}/${carFolder}`;
	const carsWithArticles = getFilledFolders(generationPath);
	const isMaxCarsCount = carsWithArticles.length >= 50;
	if (isMaxCarsCount) return;
	
	console.log(`${link}...`);
	const carData = await parseCarPage(link, browser);
	carData.preview = preview;
	fs.mkdirSync(carPath, {recursive: true});
	if (carData.articles.length < 1) return;
	fs.writeFileSync(`${carPath}/_carData.json`, JSON.stringify(carData, null, 2));
}

module.exports = {
	parseCars,
};
