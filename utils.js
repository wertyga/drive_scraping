const puppeteer = require('puppeteer');
const https = require('https');
const fs = require('fs');
const path = require('path');
const configMeta = require('./config_meta');

async function getBrowser() {
	const browser = await puppeteer.launch({
		headless: false,
		args: [
			'--proxy-server=zproxy.lum-superproxy.io:22225'
		],
	});
	browser.fastNewPage = async function(...args) {
		const page = await browser.newPage(...args);
		await page.authenticate({
			username: 'lum-customer-hl_6bbfcca9-zone-data_center-ip-181.215.0.194',
			password: 'r4sbnv3e82y8'
		});
		await page.setRequestInterception(true);
		page.on('request', (req) => {
			if (req.resourceType() === 'image' || req.url().endsWith('.css')) {
				req.abort();
			} else {
				req.continue();
			}
		});
		
		return page;
	}
	
	return browser;
}

function downloadImage(imgUrl, filePath) {
	const [ext, filename] = imgUrl.split(/\.|\//).reverse();
	return new Promise((res, rej) => {
		https.get(imgUrl, response => {
			const stream = fs.createWriteStream(`${filePath}/${filename}.${ext}`);
			response.pipe(stream);
			stream.on('finish', () => {
				stream.close();
				res();
			});
			stream.on('error', (e) => {
				stream.close();
				console.log(e);
			});
		})
	})
}

async function getBodyHtmlFromPage(page, goto, tag = 'body') {
	if (goto) {
		await page.goto(goto, {waitUntil: 'load'});
	}
	const bodyHandle = await page.$(tag);
	const html = await page.evaluate(body => body.innerHTML, bodyHandle);
	await bodyHandle.dispose();
	
	return html;
}

function replaceImageTo1920(src) {
	return src.replace(/-\d+\.jpg$/, '-1920.jpg');
}

function wait (ms = 1000) {
	return new Promise(resolve => setTimeout(() => resolve(), ms));
}

async function scrollDown(url, browser) {
	// Load the specified page
	const page = await browser.newPage();
	await page.goto(url, {waitUntil: 'load'});
	await page.setRequestInterception(true);
	page.on('request', (req) => {
		if (req.resourceType() === 'image') {
			req.abort();
		} else {
			req.continue();
		}
	});
	
	// Get the height of the rendered page
	const bodyHandle = await page.$('body');
	
	let currentHeight = 0;
	let isDown = false
	while (!isDown) {
		const scrollHeight = await page.evaluate(() => {
			window.scrollBy(0, 1000);
			return window.scrollY;
		});
		await wait(1000);
		if (scrollHeight === currentHeight) {
			isDown = true;
		} else {
			currentHeight = scrollHeight;
		}
	}
	
	const html = await page.evaluate(body => body.innerHTML, bodyHandle);
	await bodyHandle.dispose();
	await page.close();
	
	return html;
}

function clearHtmlText(text) {
	return text.replace(/\n|\s/g, '')
}

async function intervalParsing(links, callback, timeout = 1000) {
	const result = [];
	for(let i = 0; i < links.length; i++) {
		const data = await callback(links[i]);
		result.push(data);
		await wait(timeout);
	}
	
	return result;
}

function constructPath(pathname) {
	return path.join(__dirname, pathname);
}

async function partialFetch(
	map,
	handler,
	options = {}
) {
	const { onProcess = () => {}, partial = 1, timeout = 100 } = options;
	const maxPage = Math.ceil(map.length / partial);
	const errors= [];
	const result = [];
	
	for(let i = 0; i < maxPage; i++) {
		let currentEntities;
		try {
			currentEntities = map
				.slice(i * partial, i * partial + partial)
				.map(entity => entity);
			const data = await Promise.all(
				currentEntities.map((entity, index) => {
					return handler(entity, (index + 1) * (i + 1));
				})
			);
			result.push(...data);
		} catch (e) {
			errors.unshift(
				...currentEntities.map(en => ({ entity: en, msg: e.message }))
			);
		} finally {
			await wait(timeout);
			onProcess(result.length, errors);
		}
	}
	
	return {
		errors,
		result,
	};
}

function getFilesFromFolder(folderPath, filter = []) {
	const result = [];
	const entities = fs.readdirSync(folderPath);
	entities
		.filter(n => !filter.includes(n))
		.forEach(en => {
		const entityPath = path.join(folderPath, en);
		const isDirectory = fs.statSync(entityPath).isDirectory();
		if (isDirectory) {
			const files = getFilesFromFolder(entityPath, filter);
			result.push(...files);
		} else {
			result.push({
				file: en,
				path: `${folderPath}/${en}`
			});
		}
	});
	return result;
}

function getNestedFilesFolders(pathFolder, deep, filterFiles) {
	const result = [];
	const entities = fs.readdirSync(pathFolder).filter(ff => !filterFiles.includes(ff));
	const files = entities.filter(f => fs.statSync(`${pathFolder}/${f}`).isFile());
	const newEn = entities.filter(en => !files.includes(en));
	result.push(...files);
	if (deep === 0) {
		result.push(...newEn);
	} else {
		newEn.forEach(entity => {
			const tt = getNestedFilesFolders(`${pathFolder}/${entity}`, deep - 1, filterFiles);
			result.push(...tt);
		});
	}
	
	return result;
}

async function handleAccessDenied($, callback) {
	if ($(configMeta.error.accessDeniedSelector).length > 0) {
		console.log('ACCESS denied');
		await wait(2000);
		return callback();
	}
}


module.exports = {
	getBrowser,
	downloadImage,
	getBodyHtmlFromPage,
	replaceImageTo1920,
	clearHtmlText,
	handleAccessDenied,
	wait,
	constructPath,
	intervalParsing,
	scrollDown,
	partialFetch,
	getFilesFromFolder,
	getNestedFilesFolders,
};
