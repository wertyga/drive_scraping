const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const shortID = require('short-id');
const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const configMeta = require('./config_meta');
const config = require('./config');
const {
	getBrowser,
	getBodyHtmlFromPage,
	clearHtmlText,
	constructPath,
	partialFetch,
	downloadImage,
	getFilesFromFolder,
	getNestedFilesFolders,
} = require('./utils');
const { parseCars } = require('./parseCars');
const {parseCarPage} = require('./carPage');
const {collectAllGenerationsFiles, getParsedCarsIDs, getFilledFolders, getParsedGenerations} = require('./otherStaff');

async function scrape() {
	try {
		const browser = await puppeteer.launch({});
		const page = await browser.newPage();
		await page.goto('https://www.drive2.com/cars/acura/cl/g10/');
		await page.waitForSelector('.c-car-card-sa');
		const bodyHandle = await page.$('body');
		const carCards = await page.evaluate(body => {
			const cards = body.querySelectorAll('.c-car-card-sa');
			return Array.from(cards).map(card => card.innerHTML)
		}, bodyHandle);
		browser.close()
	} catch (e) {
	  console.log({error: e});
	}
}
async function collectCarsLinks() {
	try {
		const browser = await getBrowser();
		const page = await browser.newPage();
		await page.goto(configMeta.cars.url);
		const bodyHandle = await page.$('body');
		
		const carsGenesisData = await page.evaluate(body => {
			const links = body.querySelectorAll('.c-makes__item a.c-link');
			return Array.from(links).reduce((acc, link) => {
				const car = link.innerText.replace(/\n|\s/g, '');
				const carLink = link.getAttribute('href');
				return {...acc, [car]: { link: carLink } }
			})
		}, bodyHandle);
		fs.writeFileSync(path.join(__dirname, 'cars.json'), JSON.stringify(carsGenesisData, null, 2), 'utf8')
		
		browser.close();
	} catch (e) {
		console.log({error: e});
	}
}

async function collectBrands() {
	const {cars} = configMeta;
	const browser = await puppeteer.launch();
	const page = await browser.newPage();
	const html = await getBodyHtmlFromPage(page, cars.url);
	const $ = cheerio.load(html);
	const brands = $(cars.carLinkSelector).map(function() {
		return {
			title: clearHtmlText($(this).text()),
			link: `${config.domain}${$(this).attr('href')}`,
		};
	}).toArray();
	
	fs.writeFileSync(path.join(__dirname, 'brands/brands.json'), JSON.stringify(brands, null, 2));
	await browser.close();
};

async function constructCars() {
	const brandsFolder = constructPath('brands');
	const data = {};
	fs.readdirSync(brandsFolder).forEach(brand => {
		const modelPath = brandsFolder + '/' + brand;
		const models = fs.readdirSync(modelPath);
		models.forEach(model => {
			const generationsPath = modelPath + '/' + model;
			const generations = fs.readdirSync(generationsPath);
			generations.forEach(generationFile => {
				const generation = generationFile
					.replace('.json', '')
					.replace(brand, '')
				const generationCars = JSON.parse(fs.readFileSync(generationsPath + '/' + generationFile, 'utf8'));
				data[brand] = [
					..._.get(data, brand, []),
					{ model, generation, data: generationCars },
				]
			})
		})
	});
	fs.writeFileSync(constructPath('cars.json'), JSON.stringify(data, null, 2));
}

async function downloadCarImages({gallery, articles}, carFolder) {
	const galleryFolder = `${carFolder}/galley`;
	const articlesImagesFolder = `${carFolder}/articleImages`;
	fs.mkdirSync(galleryFolder, { recursive: true });
	fs.mkdirSync(articlesImagesFolder, { recursive: true });
	
	const {errors: galleryErrors} = await partialFetch(gallery, image => {
		return downloadImage(image, galleryFolder);
	}, {partial: 10});
	
	const articleImages = _.flatten(articles.map(({ body, articlePreviews }) => {
		const $ = cheerio.load(body);
		const images = $('img').map(function () {
			return $(this).attr('src');
		}).toArray();
		
		return [...images, ...articlePreviews];
	}));
	const {errors: articlesImagesErrors} = await partialFetch(articleImages, (image) => {
		return downloadImage(image, articlesImagesFolder);
	}, {partial: 10});
	
	console.log({articlesImagesErrors, galleryErrors});
}

async function collectArticles() {
	const browser = await getBrowser();
	try {
		const parsedCarsIds = getParsedCarsIDs();
		const parsedCarsGenerations = getParsedGenerations();
		const generationsPaths = collectAllGenerationsFiles()
			.filter(({ generation }) => !parsedCarsGenerations.includes(generation));
		const {errors: articlesImagesErrors} = await partialFetch(generationsPaths, async (car) => {
			return parseCars(car, parsedCarsIds, browser);
		}, {partial: 2});
		
		console.log(generationsPaths);
	} catch (e) {
	  console.log(e);
	} finally {
		await browser.close();
	}
}



collectArticles()
