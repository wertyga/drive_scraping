const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const {getNestedFilesFolders} = require('./utils');

let carsCount = 0;
function getCarsCount(path) {
	const items = fs.readdirSync(path);
	items.forEach(item => {
		if (fs.statSync(path + '/' + item).isDirectory()) {
			getCarsCount(path + '/' + item);
		} else {
			const carsData = fs.readFileSync(path + '/' + item, 'utf8');
			carsCount += JSON.parse(carsData).cars.length;
		}
	})
}

function collectAllGenerationsFiles() {
	try {
		const generationsPaths = [];
		const brandsPath = path.join(__dirname, 'brands');
		const brands = fs.readdirSync(brandsPath);
		brands.forEach(brand => {
			const modelsPath = path.join(brandsPath, brand);
			const models = fs.readdirSync(modelsPath);
			models.forEach(model => {
				const generationsPath = path.join(modelsPath, model);
				const generations = fs.readdirSync(generationsPath);
				generations.forEach(generationFile => {
					generationsPaths.push({
						brand,
						model,
						generation: generationFile.replace('.json', ''),
						path: path.join(generationsPath, generationFile),
					});
				})
			})
		});
		
		return generationsPaths;
	} catch (e) {
		console.log(e);
	}
}

function getParsedCarsIDs() {
	const parsedCars = getNestedFilesFolders(path.join(__dirname, 'cars'), 3, ['_meta.json'])
	return _.uniq(parsedCars.map((car) => {
		return car.split('_')[1];
	}));
}
function getParsedGenerations() {
	const parsedGenerations = getNestedFilesFolders(path.join(__dirname, 'cars'), 2, ['_meta.json'])
	return _.uniq(parsedGenerations);
}

function getFilledFolders(rootFolder) {
	const result = [];
	const folders = fs.readdirSync(rootFolder).filter(f => f !== '_meta.json');
	folders.forEach(folder => {
		const isFolderFull = fs.readdirSync(`${rootFolder}/${folder}`).length > 0;
		if (isFolderFull) {
			result.push(folder);
		}
	});
	
	return result;
}

module.exports = {
	collectAllGenerationsFiles,
	getParsedCarsIDs,
	getFilledFolders,
	getParsedGenerations,
};
