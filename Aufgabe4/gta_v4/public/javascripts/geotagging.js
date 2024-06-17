console.log("The geoTagging script is going to start...");

/**
 * A class to help using the HTML5 Geolocation API.
 */
class LocationHelper {
    // Location values for latitude and longitude are private properties to protect them from changes.
    #latitude = '';
    #longitude = '';

    /**
     * Getter method allows read access to privat location property.
     */
    get latitude() {
        return this.#latitude;
    }

    get longitude() {
        return this.#longitude;
    }

    /**
     * The 'findLocation' method requests the current location details through the geolocation API.
     * It is a static method that should be used to obtain an instance of LocationHelper.
     * Throws an exception if the geolocation API is not available.
     * @param {*} callback a function that will be called with a LocationHelper instance as parameter, that has the current location details
     */
    static findLocation(callback) {
        const geoLocationApi = navigator.geolocation;

        if (!geoLocationApi) {
            throw new Error("The GeoLocation API is unavailable.");
        }

        // Call to the HTML5 geolocation API.
        // Takes a first callback function as argument that is called in case of success.
        // Second callback is optional for handling errors.
        // These callbacks are given as arrow function expressions.
        geoLocationApi.getCurrentPosition((location) => {
            // Create and initialize LocationHelper object.
            let helper = new LocationHelper();
            helper.#latitude = location.coords.latitude.toFixed(5);
            helper.#longitude = location.coords.longitude.toFixed(5);
            // Pass the locationHelper object to the callback.
            callback(helper);
        }, (error) => {
            alert(error.message)
        });
    }
}

/**
 * A class to help using the MapQuest map service.
 */
class MapManager {

    #map
    #markers

    /**
     * Initialize a Leaflet map
     * @param {number} latitude The map center latitude
     * @param {number} longitude The map center longitude
     * @param {number} zoom The map zoom, defaults to 18
     */
    initMap(latitude, longitude, zoom = 18) {
        // set up dynamic Leaflet map
        this.#map = L.map('map').setView([latitude, longitude], zoom);
        var mapLink = '<a href="http://openstreetmap.org">OpenStreetMap</a>';
        L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; ' + mapLink + ' Contributors'
        }).addTo(this.#map);
        this.#markers = L.layerGroup().addTo(this.#map);
    }

    /**
     * Update the Markers of a Leaflet map
     * @param {number} latitude The map center latitude
     * @param {number} longitude The map center longitude
     * @param {{latitude, longitude, name}[]} tags The map tags, defaults to just the current location
     */
    updateMarkers(latitude, longitude, tags = []) {
        this.#markers.clearLayers();
        L.marker([latitude, longitude]).bindPopup("Your Location").addTo(this.#markers);
        for (const tag of tags) {
            L.marker([tag.latitude, tag.longitude]).bindPopup(tag.name).addTo(this.#markers);
        }
    }
}

/**
 * TODO: 'updateLocation'
 * A function to retrieve the current location and update the page.
 * It is called once the page has been fully loaded.
 */
function updateLocation() {
    LocationHelper.findLocation(function (location) {
        const latitude = location.latitude;
        const longitude = location.longitude;
        document.getElementById("latitude_tagging").setAttribute("placeholder", latitude);
        document.getElementById("longitude_tagging").setAttribute("placeholder", longitude);
        document.getElementById("latitude_tagging").value = latitude;
        document.getElementById("longitude_tagging").value = longitude;
        document.getElementById("discovery__latitude").value = latitude;
        document.getElementById("discovery__longitude").value = longitude;
        let tagsString = document.getElementById("map").dataset.markers;
        let tags = JSON.parse(tagsString);
        const map = new MapManager();
        map.initMap(latitude, longitude);
        map.updateMarkers(latitude, longitude, tags);
        document.getElementById("mapView").remove();
        document.getElementById("map").getElementsByTagName("span")[0].remove();
    });
}

// Wait for the page to fully load its DOM content, then call updateLocation
document.addEventListener("DOMContentLoaded", () => {
    updateLocation();
});
