const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const shortID = require('short-id');
const configMeta = require('./config_meta');
const config = require('./config');
const {getBrowser, getBodyHtmlFromPage, replaceImageTo1920, wait, partialFetch} = require('./utils');
const { parseLogbookOnFly, parseLogbookPageByPage} = require('./carLogbookPage')
const { parseCarPostView } = require('./carPostView')

// Collect all posts for car
async function parseCarPage(carPageUrl, browser) { // https://www.drive2.com/r/bmw/3_series/1217988/
	const {carPage, carPostView} = configMeta;
	const page = await browser.fastNewPage();
	try {
		const html = await getBodyHtmlFromPage(page, carPageUrl);
		const $ = cheerio.load(html);
		
		const mainDescription = await parseCarPageArticleBody(page, html);
		const gallery = await collectImagesFromGallery(html);
		const href = $(carPostView.user.linkSelector).attr('href');
		const owner = {
			name: $(carPostView.user.usernameSelector).html(),
			link: `${config.domain}${href}`,
		};
		
		const entireLogbook = $(carPage.logbookEntireLinkSelector).attr('href');
		let articles = [];
		if (!entireLogbook) {
			console.log({parseCarPage: 'No entireLogbook', carPageUrl});
			await parseLogbookOnFly(html);
		} else {
			const logbookUrl = `${config.domain}/${entireLogbook}`;
			const cardLinksAndMainImages = await parseLogbookPageByPage(logbookUrl, browser);
			
			return cardLinksAndMainImages;
			
			const {errors: postErrors, result } = await partialFetch(cardLinksAndMainImages, ({ link, articlePreviews }) => {
				return parsePostWithLink(link, articlePreviews, browser)
			}, { partial: 10 });
			
			if (postErrors.length > 0) {
				fs.writeFileSync(path.join(__dirname, `postErrors/${shortID.generate()}.json`), JSON.stringify({
					errors: postErrors,
					carPageUrl,
				}, null, 2));
			}
			articles.push(...result)
		}
		

		return {
			mainDescription,
			gallery,
			owner,
			articles,
		};
	} catch (e) {
		console.log({error: e});
	} finally {
		await page.close();
	}
};

async function parsePostWithLink(link, articlePreviews, browser) {
	const article = await parseCarPostView(link, browser);
	await wait(1000);
	
	return {...article, articlePreviews};
}

async function collectImagesFromGallery(pageHtml) {
	const {carPage} = configMeta;
	try {
		const $ = cheerio.load(pageHtml);
		
		const gallery = $(carPage.galleryMainPicSelector);
		if (!gallery) {
			return [];
		}
		return $(carPage.galleryImagesSelector).map(function () {
			const src = $(this).attr('src');
			return replaceImageTo1920(src);
		}).toArray();
	} catch (e) {
		console.log({error: e});
		return [];
	}
}

async function parseCarPageArticleBody(page, pageHtml) {
	const {carPage} = configMeta;
	const $ = cheerio.load(pageHtml);
	try {
		const textBody = $(carPage.articleBodySelector).html();
		const carAttrs = $(carPage.articleCarAttrsSelector).map(function() {
			return $(this).text();
		}).toArray().map(t => t.trim().replace(/\n/g, ''));
		
		return {
			carTitle: $(carPage.carTitleSelector).text(),
			textBody,
			carAttrs,
		};
	} catch (e) {
	 console.log({error: e});
	 return {};
	}
}


module.exports = {
	parseCarPage,
}
