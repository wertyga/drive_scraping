const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const configMeta = require('./config_meta');
const {getBrowser, downloadImage} = require('./utils');

async function parseCarPostView(pageLink, browser) { // https://www.drive2.ru/l/626169124313115797/
	const {carPostView} = configMeta;
	const attrsForRemove = ['class', 'style', 'itemscope', 'itemtype', 'itemprop', 'data-action', 'data-size', 'data-defined'];
	const page = await browser.fastNewPage();
	try {
		await page.goto(pageLink);
		const bodyHandle = await page.$('body');
		const html = await page.evaluate(body => body.innerHTML, bodyHandle);
		await bodyHandle.dispose();
		const $ = cheerio.load(html);
		
		$('.c-pic-zoom__label').remove();
		$('.c-post__pic .o-img > span').remove();
		const articleBody = $(carPostView.article.articleBodySelector);
		articleBody.find('*').each(function() {
			attrsForRemove.forEach(attr => {
				$(this).removeAttr(attr);
			});
		})
		if (!articleBody.html()) {
			console.log({pageLink, articleBody});
		}
		const article = {
			title: $(carPostView.article.titleSelector).text(),
			body: !!articleBody.html() && articleBody.html().replace(/\s{2,}/g, '').replace(/\n/g, ''),
			cost: $(carPostView.article.postInfoCostSelector).text().replace(/ /g, ' '),
			mileage: $(carPostView.article.postInfoMileageSelector).text().replace(/ /g, ' '),
		};
		
		return article;
	} catch (e) {
		console.log({error: e});
		return null;
	} finally {
		page.close();
	}
}

// parseCarPostView('https://www.drive2.com/l/575518746790068715/')

module.exports = {
	parseCarPostView,
};
