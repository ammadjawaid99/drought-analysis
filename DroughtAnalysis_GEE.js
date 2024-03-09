// Function to calculate MIDI and SDCI
var indices = function (month, year) {
    // Import the feature collection for administrative boundaries
    var admin2 = ee.FeatureCollection("FAO/GAUL/2015/level0");
    var Germany = admin2.filter(ee.Filter.eq('ADM0_NAME', 'Germany'));
    var geometry = Germany.geometry();

    var startDate = ee.Date.fromYMD(year, month, 1);
    var endDate = startDate.advance(1, 'month');

    //// NDVI/////////

    var NDVIdataset = ee.ImageCollection('MODIS/061/MOD13A3')
        .filter(ee.Filter.date(startDate, endDate));
    var ndvi = NDVIdataset.select('NDVI').mean().clip(geometry);

    // Calculate global min and max for normalization
    var NDVIminMax = ndvi.reduceRegion({
        reducer: ee.Reducer.minMax(),
        geometry: geometry,
        scale: 30,
        maxPixels: 1e13
    });

    var NDVImin = ee.Number(NDVIminMax.get('NDVI_min'));
    var NDVImax = ee.Number(NDVIminMax.get('NDVI_max'));

    // Normalize the NDVI
    var normalizedNDVI = ndvi.expression(
        '(NDVI - min) / (max - min)', {
        'NDVI': ndvi.select('NDVI'),
        'min': NDVImin,
        'max': NDVImax
    }).rename('VCI');


    //////// LST.../////

    var LSTdataset = ee.ImageCollection('MODIS/061/MOD21C3')
        .filter(ee.Filter.date(startDate, endDate));
    var landSurfaceTemperature = LSTdataset.select('LST_Day').mean().subtract(273.15).clip(geometry);


    // Calculate global min and max for normalization
    var LSTminMax = landSurfaceTemperature.reduceRegion({
        reducer: ee.Reducer.minMax(),
        geometry: geometry,
        scale: 30,
        maxPixels: 1e13
    });

    var LSTmin = ee.Number(LSTminMax.get('LST_Day_min'));
    var LSTmax = ee.Number(LSTminMax.get('LST_Day_max'));

    // Normalize the LST
    var normalizedLST = landSurfaceTemperature.expression(
        '(max - LST) / (max - min)', {
        'LST': landSurfaceTemperature.select('LST_Day'),
        'min': LSTmin,
        'max': LSTmax
    }).rename('TCI');

    ////soil moisture ////

    var SMdataset = ee.ImageCollection('NASA/SMAP/SPL3SMP_E/005')
        .filter(ee.Filter.date(startDate, endDate));

    var soilMositureSurface = SMdataset.select('soil_moisture_am').mean().clip(geometry);


    // Calculate global min and max for normalization
    var SMminMax = soilMositureSurface.reduceRegion({
        reducer: ee.Reducer.minMax(),
        geometry: geometry,
        scale: 30,
        maxPixels: 1e13
    });

    var SMmin = ee.Number(SMminMax.get('soil_moisture_am_min'));
    var SMmax = ee.Number(SMminMax.get('soil_moisture_am_max'));

    // Normalize the SM
    var normalizedSM = soilMositureSurface.expression(
        '(SM - min) / (max - min)', {
        'SM': soilMositureSurface.select('soil_moisture_am'),
        'min': SMmin,
        'max': SMmax
    }).rename('SMCI');

    /////////// CDR precipitation)   ///////////////

    var PPTdataset = ee.ImageCollection('NOAA/PERSIANN-CDR')
        .filter(ee.Filter.date(startDate, endDate));
    var precipitation = PPTdataset.select('precipitation').mean().clip(geometry);

    // Calculate global min and max for normalization
    var PPTminMax = precipitation.reduceRegion({
        reducer: ee.Reducer.minMax(),
        geometry: geometry,
        scale: 30,
        maxPixels: 1e13
    });

    var PPTmin = ee.Number(PPTminMax.get('precipitation_min'));
    var PPTmax = ee.Number(PPTminMax.get('precipitation_max'));

    // Normalize the Precipitation
    var normalizedPrecipitation = precipitation.expression(
        '(precipitation - min) / (max - min)', {
        'precipitation': precipitation.select('precipitation'),
        'min': PPTmin,
        'max': PPTmax
    }).rename('PCI');

    var indices = normalizedNDVI.addBands(normalizedLST).addBands(normalizedSM).addBands(normalizedPrecipitation)

    //// MIDI ///////

    // Calculate MIDI using the provided formula
    var MIDI = indices.expression(
        'a * PCI + b * SMCI + (1 - a - b) * TCI', {
        'PCI': indices.select('PCI'),
        'SMCI': indices.select('SMCI'),
        'TCI': indices.select('TCI'),
        'a': 0.5,
        'b': 0.3
    }
    );

    ///// SDCI /////

    // Calculate SDCI using the provided formula

    var SDCI = indices.expression(
        'a * TCI + b * PCI + (1 - a - b) * VCI', {
        'TCI': indices.select('TCI'),
        'PCI': indices.select('PCI'),
        'VCI': indices.select('VCI'),
        'a': 0.5,
        'b': 0.3
    }
    );

    var projectionEPSG3035 = 'EPSG:3035';

    // Reproject MIDI to the desired CRS and scale directly, without reduceResolution
    var Resampled_MIDI = MIDI.reproject({
        crs: projectionEPSG3035,
        scale: 90 // Ensure this scale matches your intended analysis resolution
    });

    var Resampled_SDCI = SDCI.reproject({
        crs: projectionEPSG3035,
        scale: 90 // Ensure this scale matches your intended analysis resolution
    });

    // Get the export region from the shapefile geometry
    var exportGeometry = Germany.geometry();

    // Export the image to Google Drive
    Export.image.toDrive({
        'image': Resampled_MIDI,
        'description': 'MIDI_' + month + '_' + year,
        'fileNamePrefix': 'MIDI_' + month + '_' + year,
        'folder': 'Germany',
        'scale': 90,
        'region': exportGeometry,
        'crs': 'EPSG:3035',
        'fileFormat': 'GeoTIFF',
        'maxPixels': 1e13,
        'formatOptions': {
            'cloudOptimized': true
        }
    });


    // Export the image to Google Drive
    Export.image.toDrive({
        'image': Resampled_SDCI,
        'description': 'SDCI_' + month + '_' + year,
        'fileNamePrefix': 'SDCI_' + month + '_' + year,
        'folder': 'Germany',
        'scale': 90,
        'region': exportGeometry,
        'crs': 'EPSG:3035',
        'fileFormat': 'GeoTIFF',
        'maxPixels': 1e13,
        'formatOptions': {
            'cloudOptimized': true
        }
    });



    return Resampled_MIDI;
}

var january2021 = indices(1, 2021);

