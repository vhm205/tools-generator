const cliProgress       = require('cli-progress');
const async             = require('async');
const _                 = require('lodash');
const faker             = require('faker');
const chalk             = require('chalk');
const log               = console.log;

const PRODUCT_COLL      = require('../../packages/product/databases/product-coll');
const CATEGORY_COLL     = require('../../packages/product/databases/category-coll');
const TAG_COLL          = require('../../packages/product/databases/tag-coll');
const IMAGE_COLL        = require('../../packages/image/databases/image-coll');

// create new container
const multibar = new cliProgress.MultiBar({
    clearOnComplete: false,
    hideCursor: true

}, cliProgress.Presets.shades_grey);

const fakerTag = async () => {
    return new Promise(async resolve => {
        let items   = [];
        let status  = [1, 2];

        // create a new progress bar instance and use shades_classic theme
        const progressBar = multibar.create(3000, 0);

        for(let i = 0; i <= 3000; i++){
            items.push({
                name: faker.lorem.words(2),
                status: _.sample(status),
            })
            progressBar.increment();
            progressBar.update(i);
            await new Promise(resolve => setTimeout(resolve, 0));
        }

        await TAG_COLL.deleteMany({});
        await TAG_COLL.insertMany(items);
        resolve();
    })
}

const fakerCategory = async () => {
    return new Promise(async resolve => {
        let items = [];
        let status  = [1, 2];

        const progressBar = multibar.create(3000, 0);
        const images      = await IMAGE_COLL.find({}, { _id: 1 }).lean();

        for(let i = 0; i <= 3000; i++){
            items.push({
                title: faker.name.title(),
                description: faker.lorem.paragraphs(),
                gallery: [
                    _.sample(images)._id, 
                    _.sample(images)._id, 
                    _.sample(images)._id
                ],
                status: _.sample(status),
            })
            progressBar.increment();
            progressBar.update(i);
            await new Promise(resolve => setTimeout(resolve, 0));
        }

        await CATEGORY_COLL.deleteMany({});
        await CATEGORY_COLL.insertMany(items);
        resolve();
    })
}

const fakerProduct = async () => {
    return new Promise(finalResolve => {
        new Promise((firstResolve) => {
            async.parallel([
                callback => {
                    CATEGORY_COLL
                        .find({ state: 1 }, { _id: 1 })
                        .exec((_, categoryID) => {
                            callback(null, categoryID);
                        }); 
                },
                callback => {
                    TAG_COLL
                        .find({ state: 1 }, { _id: 1 })
                        .exec((_, tagID) => {
                            callback(null, tagID);
                        });
                },
                callback => {
                    IMAGE_COLL
                        .find({}, { _id: 1 })
                        .exec((_, imageID) => {
                            callback(null, imageID);
                        });
                }
            ], (_, results) => {
                firstResolve(results);
            });
        }).then(async results => {
            let items   = [];
            let status  = [1, 2];

            const progressBar = multibar.create(3000, 0);
            const [categories, tags, images] = results;

            for(let i = 0; i <= 3000; i++){
                items.push({
                    name: faker.commerce.productName(),
                    price: faker.commerce.price(100_000, 10_000_000),
                    content: faker.lorem.paragraphs(),
                    avatar: _.sample(images)._id,
                    status: _.sample(status),
                    gift: _.sample(status),
                    sale: _.sample(status),
                    category: _.sample(categories)._id,
                    gallery: [
                        _.sample(images)._id, 
                        _.sample(images)._id, 
                        _.sample(images)._id
                    ],
                    tag: [
                        _.sample(tags)._id,
                        _.sample(tags)._id
                    ],
                    datePublic: faker.date.between(new Date(), new Date()),
                });
                progressBar.increment();
                progressBar.update(i); 
                await new Promise(resolve => setTimeout(resolve, 0));
            }

            await PRODUCT_COLL.deleteMany({});
            await PRODUCT_COLL.insertMany(items);
            
            multibar.stop();
            finalResolve();
        })
    })
}

(async () => {
    await fakerTag();
    await fakerCategory();
    await fakerProduct();

    log(chalk.green(`Hey, done!!`));
})()
