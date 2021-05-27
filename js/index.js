

mapboxgl.accessToken =
'pk.eyJ1IjoiaXZhbm5hbGlzIiwiYSI6ImNrbzM0Y2c5ZjBzOTAydmpudXdtcnBuZTYifQ.BRwjq1JbwZfZOty3CnXTXA';

const sheet_url = "https://docs.google.com/spreadsheets/d/1zh10oPPSiPEvb2EZFD-UZf2H1_sq_rgj"

// don't change anything below
const transformRequest = (url, resourceType) => {
    var isMapboxRequest =
        url.slice(8, 22) === "api.mapbox.com" ||
        url.slice(10, 26) === "tiles.mapbox.com";
    return {
        url: isMapboxRequest ?
            url.replace("?", "?pluginName=sheetMapper&") :
            url
    };
};
 
const map = new mapboxgl.Map({
    container: 'map', // container id
    style: 'mapbox://styles/mapbox/streets-v11', // style URL
    center: [-3.931, 50.3465], // starting position [lng, lat]
    zoom: 18, // starting zoom
    transformRequest: transformRequest
});

map.addControl(new mapboxgl.NavigationControl());

$(document).ready(function () {
    $.ajax({
        type: "GET",
        url: sheet_url + "/gviz/tq?tqx=out:csv&sheet=dataset",
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
            map.on('load', function () {
                map.addLayer({
                    'id': 'csvData',
                    'type': 'circle',
                    'source': {
                        'type': 'geojson',
                        'data': data
                    },
                    'paint': {
                        'circle-radius': 4,
                        'circle-color': 'purple'
                    }
                });
            });

            map.on('click', function (e) {
                var features = map.queryRenderedFeatures(e.point, {
                    layers: ['csvData'] // replace this with the name of the layer
                });

                if (!features.length) {
                    return;
                }
                let feature = features[0];
                let popup = new mapboxgl.Popup({
                        offset: [0, 0]
                    })
                    .setLngLat(feature.geometry.coordinates)
                    .setHTML(`<p style="text-align:center;font-family:'Roboto'" class="center">Image Name </p><h3 style="font-size:16px; font-weight:bold;text-align:center;border-bottom: 0.5px solid #ccc;padding: 5px;">${feature.properties.preview_name}</h3><iframe width="100%" height="250px" allowfullscreen style="border-style:none;" src="imgprev.html?thumb=${feature.properties.thumb}&show_high=${feature.properties.image_link}"></iframe> `) // CHANGE THIS TO REFLECT THE PROPERTIES YOU WANT TO SHOW
                    .setLngLat(feature.geometry.coordinates)
                    .addTo(map);
            });
        });
    }
})
