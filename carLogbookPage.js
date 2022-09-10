const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const configMeta = require('./config_meta');
const config = require('./config');
const {getBrowser, downloadImage, getBodyHtmlFromPage, replaceImageTo1920, partialFetch } = require('./utils');

async function parseLogbookOnFly(pageHtml) {
	const { carPage } = configMeta;
	const $ = cheerio.load(pageHtml);
}

async function parseLogbookPageByPage(logbookUrl, browser) {
	const { carPage } = configMeta;
	const firstPage = await browser.fastNewPage();
	const html = await getBodyHtmlFromPage(firstPage, logbookUrl);
	await firstPage.close();
	const $ = cheerio.load(html);
	
	let  maxPage = 1;
	$(carPage.logbook.lastPageLinkSelector).each(function() {
		if ($(this).text() === 'Last') {
			maxPage = Number($(this).attr('title'))
		}
	});
	
	const linksData = [];
	const {errors } = await partialFetch(new Array(maxPage).fill('').map((_, i) => i), async (page) => {
		const url = page === 0 ? logbookUrl : `${logbookUrl}?page=${page}#paper`;
		const linksArr = await parseLogbookPage(url, browser);
		linksData.push(...linksArr);
	}, {partial: 10});
	
	console.log({parseLogbookPageByPage: errors});
	
	return linksData;
}

async function parseLogbookPage(logbookPageUrl, browser) { // https://www.drive2.com/r/acura/cl/466140979326353520/
	const {carPage} = configMeta;
	const page = await browser.fastNewPage();
	try {
		const html = await getBodyHtmlFromPage(page, logbookPageUrl);
		const $ = cheerio.load(html);
		
		const linksToCardsView = $(carPage.logbook.logbookCardSelector).map(function() {
			const href = $(this).find(carPage.logbook.linkToCardViewSelector).attr('href');
			const previews = $(this).find(carPage.logbook.mainCardImageSelector).map(function() {
				const src = $(this).attr('src');
				return replaceImageTo1920(src);
			}).toArray();
			
			return { link: `${config.domain}${href}`, articlePreviews: previews };
		}).toArray();
		
		return linksToCardsView;
		
	} catch (e) {
		console.log({error: e});
		return [];
	} finally {
		await page.close();
	}
}

module.exports = {
	parseLogbookPage,
	parseLogbookPageByPage,
	parseLogbookOnFly
};
