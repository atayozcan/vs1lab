// File origin: VS1LAB A3

/**
 * This script is a template for exercise VS1lab/Aufgabe3
 * Complete all TODOs in the code documentation.
 */

const {name} = require("ejs");

/**
 * A class for in-memory-storage of geotags
 *
 * Use an array to store a multiset of geotags.
 * - The array must not be accessible from outside the store.
 *
 * Provide a method 'addGeoTag' to add a geotag to the store.
 *
 * Provide a method 'removeGeoTag' to delete geo-tags from the store by name.
 *
 * Provide a method 'getNearbyGeoTags' that returns all geotags in the proximity of a location.
 * - The location is given as a parameter.
 * - The proximity is computed by means of a radius around the location.
 *
 * Provide a method 'searchNearbyGeoTags' that returns all geotags in the proximity of a location that match a keyword.
 * - The proximity constrained is the same as for 'getNearbyGeoTags'.
 * - Keyword matching should include partial matches from name or hashtag fields.
 */
class InMemoryGeoTagStore {
    id = 0;

    #geoTagMemory = []; //an array that can't be accessed outside the store

    getAllGeoTags() {
        return this.#geoTagMemory;
    }

    addGeoTag(geotag) {
        geotag.setId(this.id++);
        this.#geoTagMemory.push(geotag);
    }

    removeGeoTagbyID(id) {
        for (let i = 0; i < this.#geoTagMemory.length; i++) {
            if (this.#geoTagMemory[i].id == id) {
                this.#geoTagMemory.splice(i, 1);
            }
        }
    }

    getGeoTagsByName(name) {
        return this.#geoTagMemory.filter(geoTag => geoTag.name === name);
    }

    getNearbyGeoTags(location, radius) {
        let inputLatitude = location.latitude;  // extract the latitude information from clients location
        let inputLongitude = location.longitude;  // extract the longitude information from clients location
        let r = 6371;   //radius of the earth in kilometer

        function degToRad(deg) {     //function to convert degree to radiant
            return deg * (Math.PI / 180);
        }

        let nearbyGeoTags = [];     //creates an array to store nearby GeoTags

        for (let i = 0; i < this.#geoTagMemory.length; i++) {       //controls each element of geoTagMemory

            //calculates the distance between given location and i-th geoTagMemory element.
            let difLong = degToRad(inputLongitude - this.#geoTagMemory[i].longitude);
            let difLat = degToRad(inputLatitude - this.#geoTagMemory[i].latitude);
            let a = Math.sin(difLat / 2) * Math.sin(difLat / 2) + Math.sin(difLong / 2) * Math.sin(difLong / 2) * Math.cos(degToRad(inputLatitude)) * Math.cos(degToRad(this.#geoTagMemory[i].latitude));
            let b = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            let c = r * b;


            if (c <= radius) {    //compare the distance with the given radius
                nearbyGeoTags.push(this.#geoTagMemory[i]);  //push nearby GeoTags in a new array

            }
        }

        return nearbyGeoTags;   //return the array of the nearby GeoTags
    }

    // Provide a method 'searchNearbyGeoTags' that returns all geotags in the proximity of a location that match a keyword.
    // The proximity constrained is the same as for 'getNearbyGeoTags'.
    // Keyword matching should include partial matches from name or hashtag fields.

    searchNearbyGeoTags(keyword, location, radius) { //gets keyword, location and radius information from client and returns nearby GeoTag filterd by keyword

        let nearbyGeoTags2 = this.getNearbyGeoTags(location, radius);    //calculates all nearby GeoTags and returns a new array
        let nearbyGeoTagsFiltered = [];

        for (let i = 0; i < nearbyGeoTags2.length; i++) {       //controls each element of nearbyGeoTags2

            if (nearbyGeoTags2[i].name.includes(keyword) || nearbyGeoTags2[i].hashtag.includes(keyword)) {       //if given keyword is a part of name or hashtag
                nearbyGeoTagsFiltered.push(nearbyGeoTags2[i]);          //add these Geotags to a new array
            }
        }

        return nearbyGeoTagsFiltered;

    }
}

module.exports = InMemoryGeoTagStore
