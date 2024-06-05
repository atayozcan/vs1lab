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
 *
 * TODO: implement the module in the file "../models/geotag.js"
 */
const GeoTag = require('../models/geotag');

/**
 * The module "geotag-store" exports a class GeoTagStore.
 * It provides an in-memory store for geotag objects.
 *
 * TODO: implement the module in the file "../models/geotag-store.js"
 */
const InMemoryGeoTagStore = require("../models/geotag-store");
const GeoTagExamples = require("../models/geotag-examples");
const store = new InMemoryGeoTagStore();

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

/**
 * Route '/tagging' for HTTP 'POST' requests.
 * (http://expressjs.com/de/4x/api.html#app.post.method)
 *
 * Requests cary the fields of the tagging form in the body.
 * (http://expressjs.com/de/4x/api.html#req.body)
 *
 * Based on the form data, a new geotag is created and stored.
 *
 * As response, the ejs-template is rendered with geotag objects.
 * All result objects are located in the proximity of the new geotag.
 * To this end, "GeoTagStore" provides a method to search geotags
 * by radius around a given location.
 */
router.post("/tagging", (req, res) => {
    const data = req.body
    const geoTag = new GeoTag(data.tag_latitude, data.tag_longitude, data.tag_name, data.tag_hashtag)
    store.addGeoTag(geoTag)
    return res.redirect('/')
})

/**
 * Route '/discovery' for HTTP 'POST' requests.
 * (http://expressjs.com/de/4x/api.html#app.post.method)
 *
 * Requests cary the fields of the discovery form in the body.
 * This includes coordinates and an optional search term.
 * (http://expressjs.com/de/4x/api.html#req.body)
 *
 * As response, the ejs-template is rendered with geotag objects.
 * All result objects are located in the proximity of the given coordinates.
 * If a search term is given, the results are further filtered to contain
 * the term as a part of their names or hashtags.
 * To this end, "GeoTagStore" provides methods to search geotags
 * by radius and keyword.
 */
router.post("/discovery", (req, res) => {
    const data = req.body
    const geoTag = new GeoTag(data.searchterm, data.tag_latitude, data.tag_longitude)
    store.addGeoTag(geoTag)
    return res.redirect('/')
})

module.exports = router;
