import React, { PureComponent, createRef } from 'react';
import 'ol/ol.css';
import './open-layers.css';
import {Map, View} from 'ol';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import OSM from 'ol/source/OSM';
import GeoJSON from 'ol/format/GeoJSON.js';
import VectorSource from 'ol/source/Vector.js';
import {bbox as bboxStrategy} from 'ol/loadingstrategy.js';
import {Stroke, Style} from 'ol/style.js';

export class OpenLayers extends PureComponent {
  map;
  
  componentDidMount() {
    const wfsUrl = 'https://geodata.nationaalgeoregister.nl/brpgewaspercelen/wfs';

    const vectorSource = new VectorSource({
      format: new GeoJSON(),
      url: function(extent) {
        return `${wfsUrl}?SERVICE=WFS&REQUEST=GetFeature&VERSION=2.0.0&TYPENAMES=brpgewaspercelen:brpgewaspercelen&OUTPUTFORMAT=json&SRSNAME=urn:ogc:def:crs:EPSG::4326&BBOX=${extent.join(',')},urn:ogc:def:crs:EPSG::3857`
      },
      strategy: bboxStrategy
    });
    const vector = new VectorLayer({
      source: vectorSource,
      style: new Style({
        stroke: new Stroke({
          color: 'rgba(0, 0, 255, 1.0)',
          width: 2
        })
      })
    });

    this.map = new Map({
      target: 'map',
      layers: [
        new TileLayer({
          source: new OSM()
        }),
        vector
      ],
      view: new View({
        center: [581074.2890239098, 6791277.089081339], // Ongeveer midden Nederland
        zoom: 12
      }),
    });
    this.map.on('click', e => console.log(e));
  }

  render() {
    return (
      <div id="map"></div>
    );
  }
}