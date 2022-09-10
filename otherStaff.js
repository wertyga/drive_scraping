const fs = require('fs');
const path = require('path');
const {getFilesFromFolder} = require('./utils');

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
	const parsedCars = getFilesFromFolder(path.join(__dirname, 'cars'), '_meta.json');
	return parsedCars.map(car => {
		return car.split('_')[1];
	})
}

module.exports = {
	collectAllGenerationsFiles,
	getParsedCarsIDs,
};
