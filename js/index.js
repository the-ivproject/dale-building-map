// Google sheet name
const google_sheet_name = 'https://docs.google.com/spreadsheets/d/1zh10oPPSiPEvb2EZFD-UZf2H1_sq_rgj'
// Sheet name
const sheet_name = 'dataset'

// Mapbox token
const mapbox_token = 'pk.eyJ1IjoiaXZwcm9qZWN0IiwiYSI6ImNrcDZuOWltYzJyeGMycW1jNDVlbDQwejQifQ.97Y2eucdbVp1F2Ow8EHgBQ'

// Point style 
let point_radius = 4
let point_color = 'red'

// Don't change anything below
var transformRequest = (url, resourceType) => {
    var isMapboxRequest =
        url.slice(8, 22) === "api.mapbox.com" ||
        url.slice(10, 26) === "tiles.mapbox.com";
    return {
        url: isMapboxRequest ?
            url.replace("?", "?pluginName=sheetMapper&") :
            url
    };
};

//YOUR TURN: add your Mapbox token
mapboxgl.accessToken = mapbox_token

var map = new mapboxgl.Map({
    container: 'map', // container id
    style: 'mapbox://styles/mapbox/streets-v11', // YOUR TURN: choose a style: https://docs.mapbox.com/api/maps/#styles
    center: [-3.931, 50.3465], // starting position [lng, lat]
    zoom: 10, // starting zoom
    transformRequest: transformRequest
});

map.addControl(new mapboxgl.NavigationControl());

$(document).ready(function () {
    $.ajax({
        type: "GET",
        //YOUR TURN: Replace with csv export link
        url: `${google_sheet_name}/gviz/tq?tqx=out:csv&sheet=${sheet_name}`,
        dataType: "text",
        success: function (csvData) {
            makeGeoJSON(csvData);
        }
    });

    function makeGeoJSON(csvData) {
        csv2geojson.csv2geojson(csvData, {
            latfield: 'latitude',
            lonfield: 'longitude',
            delimiter: ','
        }, function (err, data) {
            function addDataLayer(){
                map.addLayer({
                    'id': 'csvData',
                    'type': 'circle',
                    'source': {
                        'type': 'geojson',
                        'data': data
                    },
                    'paint': {
                        'circle-radius': point_radius,
                        'circle-color': point_color
                    }
                });
            }

            map.on('style.load', function () {
                // Triggered when `setStyle` is called.
                if (data) addDataLayer();
            });
            map.on('load', function () {
                document.getElementById('basemaps').addEventListener('change', function () {
                    map.setStyle(`mapbox://styles/mapbox/${this.value}`)
                    console.log(this.value)
                });
                //Add the the layer to the map
                addDataLayer()

                map.on('data', function (e) {
                    if (e.dataType === 'source' && e.sourceId === 'csvData') {
                        document.getElementById("loader").style.visibility = "hidden";
                        document.getElementById("overlay").style.visibility = "hidden";
                    }
                })

                // When a click event occurs on a feature in the csvData layer, open a popup at the
                // location of the feature, with description HTML from its properties.
                map.on('click', 'csvData', function (e) {
                    var coordinates = e.features[0].geometry.coordinates.slice();

                    //set popup text
                    //You can adjust the values of the popup to match the headers of your CSV.
                    // For example: e.features[0].properties.Name is retrieving information from the field Name in the original CSV.
                    var description =
                        `<h3 style="font-size:16px; font-weight:bold;text-align:center;border-bottom: 0.5px solid #ccc;padding: 18px;">${"ID: " + e.features[0].properties.id + ' - ' + e.features[0].properties.preview_name}</h3><img id="imageshow" width="100%" style="border-style:none;" src="${e.features[0].properties.thumb}"></img><button id="highres" class="btn btn-primary" onclick="window.open('${e.features[0].properties.image_link}')">High Resolution</button>`;

                    // Ensure that if the map is zoomed out such that multiple
                    // copies of the feature are visible, the popup appears
                    // over the copy being pointed to.
                    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
                    }

                    //add Popup to map
                    new mapboxgl.Popup()
                        .setLngLat(coordinates)
                        .setHTML(description)
                        .addTo(map);
                });

                // Change the cursor to a pointer when the mouse is over the places layer.
                map.on('mouseenter', 'csvData', function () {
                    map.getCanvas().style.cursor = 'pointer';
                });

                // Change it back to a pointer when it leaves.
                map.on('mouseleave', 'places', function () {
                    map.getCanvas().style.cursor = '';
                });

                var bbox = turf.bbox(data);
                map.fitBounds(bbox, {
                    padding: 50
                });
            });
        });
    };
});
