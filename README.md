# Drought Analysis Project on Google Earth Engine

This repository contains code for a drought analysis project implemented on Google Earth Engine. The project focuses on calculating and exporting the Moisture Deficit Index (MIDI) and Standardized Drought Condition Index (SDCI) for Germany using various remote sensing indices.

### Code Overview

The provided code defines a function, "indices", which calculates the Normalized Difference Vegetation Index (NDVI), Land Surface Temperature (LST), Soil Moisture (SM), and Precipitation (PPT) indices. These indices are then used to compute the MIDI and SDCI for a specified month and year in Germany.

### Prerequisite

Ensure that you have access to Google Earth Engine and have the necessary permissions to run the code. Additionally, set up Google Drive for exporting the results.

### Usage

- Open the code in the Google Earth Engine Code Editor.
- Modify the month and year parameters in the last line of the code to specify the desired time period for analysis.
- Run the code to calculate the indices, MIDI, and SDCI for the specified month and year.
- The results will be exported to Google Drive in GeoTIFF format with cloud optimization.

### Results

The code exports two GeoTIFF files:

- 'MIDI_month_year.tif': Moisture Deficit Index for the specified month and year.
- 'SDCI_month_year.tif': Standardized Drought Condition Index for the specified month and year.

### Contributing

If you have any suggestions or find any bugs, feel free to open an issue or submit a pull request.
