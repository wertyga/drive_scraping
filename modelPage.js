const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const {scrollDown, getBrowser, replaceImageTo1920, clearHtmlText, getBodyHtmlFromPage, intervalParsing} = require('./utils');
const configMeta = require('./config_meta');
const config = require('./config');

async function parseModelGenerationCarsLinks(modelPageLink, browser) {
	const { modelPage: { previewImageForCarSelector, modelTitleSelector, carLinkSelector, carCardSelector, modelPreviewImage } } = configMeta;
	try {
		const modelPageHtml = await scrollDown(modelPageLink, browser);
		const $ = cheerio.load(modelPageHtml);
		const cars = $(carCardSelector).map(function() {
				return {
					link: `${config.domain}${$(this).find(carLinkSelector).attr('href')}`,
					preview: replaceImageTo1920($(this).find(previewImageForCarSelector).attr('src')),
				};
		}).toArray();
		
		const result = {
			modelTitle: clearHtmlText($(modelTitleSelector).text()),
			modelPreview: $(modelPreviewImage).attr('src'),
			cars,
		}
		
		return result;
	} catch (e) {
		return {
			modelTitle: '',
			modelPreview: '',
			cars: [],
		}
	}
}

async function parseModelPage(modelLink, browser) {
	const { modelPage: { modelGenerationLinkSelector }} = configMeta;
	const page = await browser.fastNewPage();
	try {
		const html = await getBodyHtmlFromPage(page, modelLink);
		const $ = cheerio.load(html);
		await page.close();
		
		const modelGenerationLinks = $(modelGenerationLinkSelector).map(function() {
			return {
				link: $(this).attr('href'),
				title: clearHtmlText($(this).text()),
			};
		}).toArray();
		const modelCars = {};
		if (modelGenerationLinks.length === 0) {
			const model = await parseModelGenerationCarsLinks(modelLink, browser);
			modelCars[model.modelTitle] = model;
		} else {
			const models = await Promise.all(
				modelGenerationLinks.map(({link}) => {
					return parseModelGenerationCarsLinks(`${config.domain}${link}`, browser);
				})
			);
			models.forEach(model => {
				modelCars[model.modelTitle] = model;
			})
		}
		
		
		return modelCars;
	} catch (e) {
		console.log({parseModelPage: e});
		await page.close();
	}
}

module.exports = {
	parseModelPage,
};
