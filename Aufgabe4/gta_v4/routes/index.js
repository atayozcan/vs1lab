// File origin: VS1LAB A3, A4

/**
 * This script defines the main router of the GeoTag server.
 * It's a template for exercise VS1lab/Aufgabe3
 * Complete all TODOs in the code documentation.
 */

/**
 * Define module dependencies.
 */

const express = require('express');
const router = express.Router();

/**
 * The module "geotag" exports a class GeoTagStore.
 * It represents geotags.
 */
// eslint-disable-next-line no-unused-vars
const GeoTag = require('../models/geotag');

/**
 * The module "geotag-store" exports a class GeoTagStore.
 * It provides an in-memory store for geotag objects.
 */
// eslint-disable-next-line no-unused-vars
const InMemoryGeoTagStore = require("../models/geotag-store");
const GeoTagExamples = require("../models/geotag-examples");
const store = new InMemoryGeoTagStore();

// App routes (A3)

/**
 * Route '/' for HTTP 'GET' requests.
 * (http://expressjs.com/de/4x/api.html#app.get.method)
 *
 * Requests cary no parameters
 *
 * As response, the ejs-template is rendered without geotag objects.
 */
router.get('/', (req, res) => {
    for (let i = 0; i < GeoTagExamples.tagList.length; i++) {
        let item = GeoTagExamples.tagList[i];
        let example = new GeoTag(item[1], item[2], item[0], item[3]);
        const existingTags = store.getAllGeoTags();
        if (!existingTags.some(tag => tag.name === example.name)) store.addGeoTag(example);
    }
    const tags = store.getAllGeoTags()
    res.render('index', {taglist: tags})
});

router.post("/tagging", (req, res) => {
    const data = req.body
    if (!(data.tag_latitude === "")) {
        const geoTag = new GeoTag(data.tag_latitude, data.tag_longitude, data.tag_name, data.tag_hashtag)
        store.addGeoTag(geoTag)
    }
    return res.redirect('/')
})

router.post("/discovery", (req, res) => {
    const data = req.body
    const searchTerm = data.searchterm;
    const loc = {
        latitude: data.discovery_latitude,
        longitude: data.discovery_longitude
    };
    const tags = store.getNearbyGeoTags(loc, 1000);
    let filteredTags = store.searchNearbyGeoTags(searchTerm, loc, 1000);
    if (filteredTags.length === 0) filteredTags = tags
    return res.render('index', {taglist: filteredTags});
})
// API routes (A4)

/**
 * Route '/api/geotags' for HTTP 'GET' requests.
 * (http://expressjs.com/de/4x/api.html#app.get.method)
 *
 * Requests contain the fields of the Discovery form as query.
 * (http://expressjs.com/de/4x/api.html#req.query)
 *
 * As a response, an array with Geo Tag objects is rendered as JSON.
 * If 'searchterm' is present, it will be filtered by search term.
 * If 'latitude' and 'longitude' are available, it will be further filtered based on radius.
 */
router.get("/api/geotags", (req, res) => {
    const data = req.body
    const searchTerm = data.searchterm;
    const loc = {
        latitude: data.tag_latitude,
        longitude: data.tag_longitude
    };
    if (searchTerm !== undefined) {
        const filteredTags = store.getNearbyGeoTags(loc, 1000);
        res.json(filteredTags);
    } else {
        res.json(store.getAllGeoTags());
    }
})

/**
 * Route '/api/geotags' for HTTP 'POST' requests.
 * (http://expressjs.com/de/4x/api.html#app.post.method)
 *
 * Requests contain a GeoTag as JSON in the body.
 * (http://expressjs.com/de/4x/api.html#req.body)
 *
 * The URL of the new resource is returned in the header as a response.
 * The new resource is rendered as JSON in the response.
 */
router.post('/api/geotags', (req, res) => {
    const {latitude, longitude, name, hashtag} = req.body;
    let newTag = new GeoTag(latitude, longitude, name, hashtag);
    store.addGeoTag(newTag);
    res.json(newTag);
})

/**
 * Route '/api/geotags/:id' for HTTP 'GET' requests.
 * (http://expressjs.com/de/4x/api.html#app.get.method)
 *
 * Requests contain the ID of a tag in the path.
 * (http://expressjs.com/de/4x/api.html#req.params)
 *
 * The requested tag is rendered as JSON in the response.
 */
router.get("/api/geotags/:id", (req, res) => {
    const foundtag = store.getAllGeoTags().find((tag) => tag.id === req.params.id);
    console.log(foundtag);
    res.json(foundtag);
})

/**
 * Route '/api/geotags/:id' for HTTP 'PUT' requests.
 * (http://expressjs.com/de/4x/api.html#app.put.method)
 *
 * Requests contain the ID of a tag in the path.
 * (http://expressjs.com/de/4x/api.html#req.params)
 *
 * Requests contain a GeoTag as JSON in the body.
 * (http://expressjs.com/de/4x/api.html#req.query)
 *
 * Changes the tag with the corresponding ID to the sent value.
 * The updated resource is rendered as JSON in the response.
 */
router.put("/api/geotags/:id", (req, res) => {
    const data = req.body
    let foundtag = store.getAllGeoTags().find((tag) => tag.id == req.params.id);
    foundtag.name = data.name;
    foundtag.hashtag = data.hashtag;
    res.json(foundtag);
})

/**
 * Route '/api/geotags/:id' for HTTP 'DELETE' requests.
 * (http://expressjs.com/de/4x/api.html#app.delete.method)
 *
 * Requests contain the ID of a tag in the path.
 * (http://expressjs.com/de/4x/api.html#req.params)
 *
 * Deletes the tag with the corresponding ID.
 * The deleted resource is rendered as JSON in the response.
 */
router.delete("/api/geotags/:id", (req, res) => {
    let foundtag = store.getAllGeoTags().find((tag) => tag.id == req.params.id);
    store.removeGeoTagbyID(req.params.id);
    res.json(foundtag);
})

module.exports = router;
