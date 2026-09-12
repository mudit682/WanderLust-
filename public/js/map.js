maptilersdk.config.apiKey = mapToken;

function renderMap(coordinates) {
    const map = new maptilersdk.Map({
        container: 'map',
        style: maptilersdk.MapStyle.STREETS,
        center: coordinates,
        zoom: 9
    });

    const popup = new maptilersdk.Popup({ offset: 25 })
        .setHTML(`<h4>${listing.title}</h4><p>Exact Location will be provided after booking</p>`);

    new maptilersdk.Marker({ color: 'red' })
        .setLngLat(coordinates)
        .setPopup(popup)
        .addTo(map);
}

if (listing.geometry && listing.geometry.coordinates && listing.geometry.coordinates.length === 2) {
    renderMap(listing.geometry.coordinates);
} else if (listing.location) {
    fetch(`https://api.maptiler.com/geocoding/${encodeURIComponent(listing.location)}.json?key=${mapToken}`)
        .then(res => res.json())
        .then(data => {
            if (data.features && data.features.length > 0) {
                renderMap(data.features[0].geometry.coordinates);
            } else {
                renderMap([77.2090, 28.6139]);
            }
        })
        .catch(err => {
            console.error("MapTiler geocoding error:", err);
            renderMap([77.2090, 28.6139]);
        });
} else {
    renderMap([77.2090, 28.6139]);
}
