const cheerio = require('cheerio');
const shelljs = require('shelljs');
const fs = require('fs');
const path = require('path');
const {scrollDown, getBrowser, partialFetch, clearHtmlText, getBodyHtmlFromPage, intervalParsing} = require('./utils');
const configMeta = require('./config_meta');
const config = require('./config');
const {parseModelPage} = require('./modelPage');
const brandsFile = require('./brands.json');

async function parseBrandPage(brandLink, brandName) {
	const browser = await getBrowser();
	const {brandPage: { modelLinkSelector }} = configMeta;
	try {
		const page = await browser.fastNewPage();
		const html = await getBodyHtmlFromPage(page, brandLink);
		const $ = cheerio.load(html);
		
		const models = $(modelLinkSelector)
			.map(function() {
				return {
					link: `${config.domain}${$(this).attr('href')}`,
					title: clearHtmlText($(this).text()),
				}
			})
			.toArray()
		await partialFetch([models], async ({ link, title }) => {
			const modelsData = await parseModelPage(link, browser);
			await Promise.all(Object.values(modelsData).map(model => {
				const modelFilePath = path.join(__dirname, `brands/${brandName}/${title}`);
				const filename = `${model.modelTitle.replace(/\//g, '|')}.json`;
				fs.mkdirSync(modelFilePath, { recursive: true });
				return fs.writeFileSync(`${modelFilePath}/${filename}`, JSON.stringify(model, null, 2));
			}));
		}, {partial: 2});
		
	} catch (e) {
	  console.log({parseBrandPage: e});
	} finally {
		await browser.close();
	}
}

async function getMissedBrands() {
	try {
		const result = [];
		const brandPath = path.join(__dirname, 'brands');
		const brands = fs.readdirSync(brandPath);
		brands.forEach(brand => {
			const modelsPath = path.join(brandPath, brand);
			const models = fs.readdirSync(modelsPath);
			models.forEach(model => {
				const generations = fs.readdirSync(path.join(modelsPath, model));
				generations.forEach(generationFile => {
					if (generationFile === '403—Accessisdenied.json') {}
				})
			})
		});
		
	} catch (e) {
	  console.log(e);
	}
}

// -async function() {
// 	const NEED_BRANDS = [
// 		'Chevrolet',
// 		'Chrysler',
// 		'Citroen',
// 		'Daimler',
// 		'DeLorean',
// 		'Dodge',
// 		'Ferrari',
// 		'FIAT',
// 		'Ford',
// 		'Genesis',
// 		'GMC',
// 		'Honda',
// 		'Hummer',
// 		'Hyundai',
// 		'Infiniti',
// 		'Isuzu',
// 		'Iveco',
// 		'Jeep',
// 		'Jaguar',
// 		'KIA',
// 		'Lamborghini',
// 		'Lancia',
// 		'LandRover',
// 		'Lexus',
// 		'Lincoln',
// 		'Lotus',
// 		'Maserati',
// 		'Maybach',
// 		'Mazda',
// 		'Mercedes-Benz',
// 		'Mercury',
// 		'MG',
// 		'MINI',
// 		'Mitsubishi',
// 		'Nissan',
// 		'Oldsmobile',
// 		'Opel',
// 		'Peugeot',
// 		'Plymouth',
// 		'Pontiac',
// 		'Porsche',
// 		'Renault',
// 		'Rolls-Royce',
// 		'Rover',
// 		'Saab',
// 		'Saturn',
// 		'Scion',
// 		'SEAT',
// 		'Skoda',
// 		'Smart',
// 		'Subaru',
// 		'Suzuki',
// 		'Tesla',
// 		'Toyota',
// 		'Volkswagen',
// 		'Volvo',
// 		'Wiesmann',
// 		'Willys',
// 	];
// 	const parsedBrands = fs.readdirSync(path.join(__dirname, 'brands'));
// 	await intervalParsing(brands.filter(({ title }) => !parsedBrands.includes(title) && NEED_BRANDS.includes(title)), async ({ title, link }) => {
// 		await parseBrandPage(link, title);
// 	});
// }()
