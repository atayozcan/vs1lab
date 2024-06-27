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

//Zusatzaufgabe: Pagination
const tagsPerPage = 5; //die Anzahl der Einträge pro Seite
let tagCount = 0;
let page = 0;

function updatePage() {
    //updates and shows on which page we are at
    const pageText = document.getElementById("page_text");
    pageText.innerHTML = `S: ${page + 1}/${Math.ceil(tagCount / tagsPerPage)} (${tagCount})`
    //prev_page and next_page are buttons, added to the index.ejs
    const prevPage = document.getElementById("prev_page");
    const nextPage = document.getElementById("next_page");
    //if page is 0, disable the previous page button, otherwise let it work
    prevPage.disabled = page === 0;
    //if we are on the last page disable the previous page button, otherwise let it work
    nextPage.disabled = page === Math.ceil(tagCount / tagsPerPage) - 1;
    console.log("update");
}

async function previousPage() {
    console.log("prevPage");
    if (page <= 0) return;
    page--;
    const search = document.getElementById("searchterm").value;
    const latitude = parseFloat(document.getElementById("discovery__latitude").value);
    const longitude = parseFloat(document.getElementById("discovery__longitude").value);
    let tags = await getFilteredListRequest(latitude, longitude, page * tagsPerPage, tagsPerPage, search);
    updateList(tags);
    updateMap(tags);
}

async function nextPage() {
    console.log("nextPage");
    if (page >= Math.ceil(tagCount / tagsPerPage) - 1) return;
    page++;
    const search = document.getElementById("searchterm").value;
    const latitude = parseFloat(document.getElementById("discovery__latitude").value);
    const longitude = parseFloat(document.getElementById("discovery__longitude").value);
    let tags = await getFilteredListRequest(latitude, longitude, page * tagsPerPage, tagsPerPage, search);
    updateList(tags);
    updateMap(tags);
}

/**
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

async function addTag(event) {
    //Absenden der Formulare verhindern
    event.preventDefault();
    //Tipp 1: Sie können hier den serverseitigen GeoTag Konstruktor aus Aufgabe 3 im Client Skript wiederverwenden.
    const search = document.getElementById("searchterm").value;
    const latitude = document.getElementById("tag_latitude").value;
    const longitude = document.getElementById("tag_longitude").value;
    const name = document.getElementById("tag_name").value;
    const hashtag = document.getElementById("tag_hashtag").value;
    let tag = await addTagRequest(latitude, longitude, name, hashtag);
    if (!tag) return;
    let tags = await getFilteredListRequest(latitude, longitude, 0, tagsPerPage, search);
    updateList(tags);
    updateMap(tags);
}

async function searchTag(event) {
    event.preventDefault();
    const search = document.getElementById("searchterm").value;
    const latitude = parseFloat(document.getElementById("discovery__latitude").value);
    const longitude = parseFloat(document.getElementById("discovery__longitude").value);
    let tags = await getFilteredListRequest(latitude, longitude, 0, tagsPerPage, search);
    page = 0;
    updateList(tags);
    updateMap(tags);
}

async function addTagRequest(latitude, longitude, name, hashtag) {
    try {
        let response = await fetch("http://localhost:3000/api/geotags", {
            method: "POST", //per HTTP POST
            headers: {
                "Content-Type": "application/json" //Tipp 2: spezifizieren sie einen geeigneten MIME-Type für JSON im HTTP-Header Content-Type, damit der Server den Inhalt erkennt.
            }, body: JSON.stringify({latitude: latitude, longitude: longitude, name: name, hashtag: hashtag})
        });
        let tag = await response.json();
        console.log('Erfolg:', tag);
        return tag;
    } catch (error) {
        console.error('Fehler:', error);
        return null;
    }
}

async function getFilteredListRequest(lat, lon, fromIndex, count, searchterm = "") {
    try {
        let response = await fetch(`http://localhost:3000/api/geotags/pages/?` + new URLSearchParams({
            search: searchterm, lat: lat, lon: lon, fromIndex: fromIndex, count: count
        }), {
            methode: "GET", headers: {"Content-Type": "application/json"},
        });
        let {total, list} = await response.json();
        tagCount = total;
        console.log('Erfolg:', list);
        return list;
    } catch (error) {
        console.error('Fehler:', error);
        return [];
    }
}

function updateList(tags) {
    let list = document.getElementById("discoveryResults");
    list.innerHTML = "";
    for (const tag of tags) {
        let tagNode = document.createElement("li");
        tagNode.appendChild(document.createTextNode(`${tag.name} ( ${tag.latitude} ,${tag.longitude}) ${tag.hashtag}`));
        list.appendChild(tagNode);
    }
    console.log("Update List:")
    console.log(tags)
    updatePage();
}

function updateMap(tags) {
}

document.addEventListener("DOMContentLoaded", async () => {
    updateLocation();
    document.getElementById("tag_form").addEventListener("submit", addTag);
    document.getElementById("discoveryFilterForm").addEventListener("submit", searchTag);
    document.getElementById("searchterm").value = "";
    document.getElementById("prev_page").addEventListener("click", previousPage);
    document.getElementById("next_page").addEventListener("click", nextPage);
    const latitude = parseFloat(document.getElementById("discovery__latitude").value);
    const longitude = parseFloat(document.getElementById("discovery__longitude").value);
    let tags = await getFilteredListRequest(latitude, longitude, 0, tagsPerPage, "");
    updateList(tags);
    updateMap(tags);
});
