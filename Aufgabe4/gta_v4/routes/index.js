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
const GeoTagStore = require('../models/geotag-store');
let store = new GeoTagStore();
const {application} = require("express");

/**
 * adding Tag example to the GeoTag Store
 */

 const GeoTagExamples = require('../models/geotag-examples');
 const res = require('express/lib/response');
 let listExamples = GeoTagExamples.tagList;
 
 listExamples.forEach(element => {
   let newGeoTag = new GeoTag(element[1], element[2], element[0], element[3]);
   store.addGeoTag(newGeoTag);
 });
 

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
  res.render('index', { latitude: "", longitude: "" , taglist: store.getAllGeoTags()})

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

 router.post('/tagging', (req, res) => {

  const myLatitude = Number(req.body.tag_latitude);
  const myLongitude = Number(req.body.tag_longitude);

  let newTag = new GeoTag( myLatitude, myLongitude, req.body.tag_name, req.body.tag_hashtag);
  store.addGeoTag(newTag);

  //Show Tags around the newTag
  let taglist = store.getNearbyGeoTags({latitude: newTag.latitude, longitude: newTag.longitude}, 10);
  
  res.render('index', { latitude: myLatitude, longitude: myLongitude, taglist: taglist });
  //after adding tag, it will return the original state
  //I got an Error:"cannot set headers after they are sent to the client" so it's better to delete it
  // return res.redirect('back');

});

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

 router.post('/discovery', (req, res) => {

  const myLatitude = Number(req.body.tag_latitude);
  const myLongitude = Number(req.body.tag_longitude);

  let taglist = store
  .searchNearbyGeoTags(req.body.searchterm,{latitude: myLatitude, longitude: myLongitude}, 10);
  res.render('index', { latitude: myLatitude, longitude: myLongitude, taglist: taglist });

});

// API routes (A 4.2.1)

/**
 * Route '/api/geotags' for HTTP 'GET' requests.
 * (http://expressjs.com/de/4x/api.html#app.get.method)
 *
 * Requests contain the fields of the Discovery form as query.
 * (http://expressjs.com/de/4x/api.html#req.body)
 * 
 * As a response, an array with Geo Tag objects is rendered as JSON.
 * If 'searchterm' is present, it will be filtered by search term.
 * If 'latitude' and 'longitude' are available, it will be further filtered based on radius.
 */


router.get('/api/geotags', (req, res) => {

  const searchterm = req.query.search;
  const myLatitude = Number(req.query.lat);
  const myLongitude = Number(req.query.lon);
  let radius = req.query.radius;

  if(searchterm) {

    let taglist = store
    .searchNearbyGeoTags(searchterm,{latitude: myLatitude, longitude: myLongitude},radius = 10);

    res.json(taglist);

  } else {
    res.json(store.getAllGeoTags());

  }
  
  });

  // Zusatzaufgabe: Pagination
  //HTTP-Endpunkte (Routen) im Server mit Paging-Unterstützung
  router.get('/api/geotags/pages', (req, res) => {

    const searchterm = req.query.search;
    const myLatitude = Number(req.query.lat);
    const myLongitude = Number(req.query.lon);
    let radius = req.query.radius;

    const fromIndex = req.query.fromIndex;
    const count = req.query.count;
    
    let taglist = []
    let total = 0;

    if(searchterm) {
      taglist = store
      .searchNearbyGeoTags(searchterm,{latitude: myLatitude, longitude: myLongitude},radius = 10);
    } else {
      taglist = store.getAllGeoTags();
    }

    total = taglist.length;

    if(taglist.length > fromIndex)
    {
      taglist = taglist.slice(fromIndex);

      if(taglist.length > count){
        taglist = taglist.slice(0, count);
      }
    }

    res.json({total: total, list: taglist});
    });


/**
 * Route '/api/geotags' for HTTP 'POST' requests.
 * (http://expressjs.com/de/4x/api.html#app.post.method)
 *
 * Requests contain a GeoTag as JSON in the body.
 * (http://expressjs.com/de/4x/api.html#req.query)
 *
 * The URL of the new resource is returned in the header as a response.
 * The new resource is rendered as JSON in the response.
 */

router.post('/api/geotags', (req, res) => { 
  
  const {latitude, longitude, name, hashtag } = req.body; 
  const newTag = new GeoTag( latitude, longitude, name, hashtag);
  const newResource = store.addGeoTag(newTag);
  res.status(201).location("./" + newResource.id).json(newResource);
  
  });

/**
 * Route '/api/geotags/:id' for HTTP 'GET' requests.
 * (http://expressjs.com/de/4x/api.html#app.get.method)
 *
 * Requests contain the ID of a tag in the path.
 * (http://expressjs.com/de/4x/api.html#req.params)
 *
 * The requested tag is rendered as JSON in the response.
 */


router.get('/api/geotags/:id', (req, res) => { 

  const foundtag = store.getAllGeoTags().find((tag) => tag.id ==  req.params.id);
  console.log(foundtag);
  res.json(foundtag);
  });

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

 router.put('/api/geotags/:id', (req, res) => { 

  const { name, hashtag } = req.body;
  const foundtag = store.getAllGeoTags().find((tag) => tag.id ==  req.params.id);
  
  if(name) {
    foundtag.name = name;
  }

  if(hashtag){
    foundtag.hashtag = hashtag;
  }
  res.json(foundtag);
  
  });


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

// TODO: ... your code here ...
//Neue Routen realisieren
router.delete('/api/geotags/:id', (req, res) => { 

  const foundtag = store.getAllGeoTags().find((tag) => tag.id ==  req.params.id);
  store.removeGeoTagbyID(req.params.id);
  res.json(foundtag);  
  
  });

module.exports = router;
