const config_meta = {
	error: {
		accessDeniedSelector: '.error-i h1',
		text: '403 — Access is denied',
	},
	cars: {
		url: 'https://www.drive2.com/cars/',
		carLinkSelector: '.c-makes__item a.c-link'
	},
	model: {
		modelLinkSelector: '.c-makes__item a.c-link'
	},
	brandPage: {
		modelLinkSelector: '.c-makes__item a',
	},
	modelPage: {
		modelTitleSelector: 'h1',
		modelPreviewImage: '.o-img.u-grayscale-70 img',
		carCardSelector: '.c-car-card-sa',
		previewImageForCarSelector: '.c-car-card-sa__pic img',
		carLinkSelector: 'a.u-link-area',
		modelGenerationLinkSelector: 'a.c-gens__item',
		modelGenerationPreviewSelector: '.o-img.u-grayscale-70 img',
		modelGenerationYearSelector: '.c-gens__desc',
	},
	carPreview: {
		cardSelector: '.c-car-card-sa',
		imageSelector: '.c-car-card-sa__img image',
		linkSelector: '.u-link-area',
		previewSelector: ''
	},
	carPostView: {
		user: {
			linkSelector: '.c-user-card a.c-user-card__pic',
			avatarSelector: '.c-user-card a.c-user-card__pic img',
			usernameSelector: '.c-user-card__username span[itemprop="name"]',
		},
		car: {
			carLinkSelector: '.x-title-header__to-top .c-link',
		},
		article: {
			titleSelector: 'h1',
			articleBodySelector: 'div[itemprop="articleBody"]',
			postInfoCostSelector: '.c-post__info .c-post__cost',
			postInfoMileageSelector: '.c-post__info .c-post__mileage',
		},
	},
	carPage: {
		carTitleSelector: 'h1',
		galleryMainPicSelector: '.c-gallery__main-pic a',
		galleryCarouselSelector: '.pswp.pswp--open',
		galleryImagesSelector: '.c-gallery .o-img img',
		articleBodySelector: 'div[itemprop="reviewBody"]',
		articleCarAttrsSelector: '.c-car-desc__text ul li',
		logbookEntireLinkSelector: 'a.x-box-more',
		logbookCardLinkSelector: 'a.c-logbook-card',
		logbookCardImagePreviewSelector: 'a.c-logbook-card .c-logbook-card__pic img',
		logbook: {
			pageLinkSelector: 'a.c-pager__page',
			lastPageLinkSelector: 'a.c-pager__link',
			linkToCardViewSelector: '.c-post-preview__title a',
			mainCardImageSelector: '.c-preview-pic img',
			straightLogbookCardLinkSelector: 'a.c-logbook-card',
			logbookCardSelector: '.c-block.js-entity'
		},
	},
};

module.exports = config_meta;
