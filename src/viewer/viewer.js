import React, { Component, createRef } from 'react';

import './viewer.css';
import 'leaflet/dist/leaflet.css';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerRetinaIcon from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { Map, TileLayer, WMSTileLayer, GeoJSON, LayersControl, FeatureGroup } from 'react-leaflet';
import leaflet from 'leaflet';

const { BaseLayer, Overlay } = LayersControl;

class Viewer extends Component {
  icon;

  //635665.5,6766661.5 : 647433.3,6782516.5
  state = {
    zoom: 10,
    hasLocation: false,
    lat: 51.84276079,
    lon: 5.18380148,
    features: []
  };

  mapRef = createRef();

  constructor(props) {
    super(props);
    this.icon = leaflet.icon({
      iconUrl: markerIcon,
      shadowUrl: markerShadow,
      iconRetinaUrl: markerRetinaIcon,
  
      iconSize:     [25, 41], // size of the icon
      shadowSize:   [41, 41], // size of the shadow
      iconAnchor:   [12, 41], // point of the icon which will correspond to marker's location
      shadowAnchor: [12, 41],  // the same for the shadow
      popupAnchor:  [1, -34], // point from which the popup should open relative to the iconAnchor
      tooltipAnchor: [16, -28]
    });
    //this.getPlotsGeoJSONData();
  }

  //https://geodata.nationaalgeoregister.nl/brpgewaspercelen/wfs?SERVICE=WFS&REQUEST=GetFeature&VERSION=2.0.0&TYPENAMES=brpgewaspercelen:brpgewaspercelen&STARTINDEX=15000&COUNT=15000&SRSNAME=urn:ogc:def:crs:EPSG::4326&BBOX=-806.93259780368862266,-1166.08710373806115967,750.62488675272811633,-96.40268341040518862,urn:ogc:def:crs:EPSG::4326

  getPlotsGeoJSONData() {
    //const bbox = this.mapRef.current.leafletElement.getBounds().toBBoxString();
    console.log(this.mapRef.current.leafletElement.getBounds().toBBoxString());
    console.log(this.mapRef.current.leafletElement.getBounds());

    const crs = this.mapRef.current.leafletElement.options.crs;

    const bounds = this.mapRef.current.leafletElement.getBounds();
    const southWest = crs.project(bounds.getSouthWest());
    const northEast = crs.project(bounds.getNorthEast());
    
    const bbox = `${southWest.x},${southWest.y},${northEast.x},${northEast.y}`;
    // console.log(bounds.toBBoxString());

    // // definitie van de Nederlandse coördinatenstelsel
    // const RD = "+proj=sterea +lat_0=52.15616055555555 +lon_0=5.38763888888889 +k=0.9999079 +x_0=155000 +y_0=463000 +ellps=bessel +units=m +towgs84=565.2369,50.0087,465.658,-0.406857330322398,0.350732676542563,-1.8703473836068,4.0812 +no_defs";

    // const projSouthWest = proj4('EPSG:3857', 'EPSG:4326', southWest);
    // const projNorthEast = proj4('EPSG:3857', 'EPSG:4326', northEast);

    // const bbox = `${projSouthWest.join(',')},${projNorthEast.join(',')}`;
    // console.log(bbox);
    
    // const bbox = '-806.93259780368862266,-1166.08710373806115967,750.62488675272811633,-96.40268341040518862';
    const url = `https://geodata.nationaalgeoregister.nl/brpgewaspercelen/wfs?SERVICE=WFS&REQUEST=GetFeature&VERSION=2.0.0&TYPENAMES=brpgewaspercelen:brpgewaspercelen&OUTPUTFORMAT=json&STARTINDEX=0&COUNT=200&SRSNAME=urn:ogc:def:crs:EPSG::4326&BBOX=${bbox},urn:ogc:def:crs:EPSG::3857`;
    // console.log(url);
    // const params = new URLSearchParams(Object.entries({
    //   REQUEST: 'GetFeature',
    //   SERVICE: 'WFS',
    //   TYPENAMES: 'brpgewaspercelen:brpgewaspercelen',
    //   OUTPUTFORMAT: 'json',
    //   SRSNAME: 'urn:ogc:def:crs:EPSG::4326',
    //   COUNT: 200,
    //   BBOX: this.mapRef.current.leafletElement.getBounds().toBBoxString() + ',urn:ogc:def:crs:EPSG::4326'
    // }));
    // debugger;

    fetch(url)
      .then((response) => {
        return response.json();
      })
      .then((json) => {
        // debugger;
        this.setState({...this.state, features: json.features});
      })
  }

  handleClick = e => {
    //this.props.onLocationFound(e.latlng);
    // console.log(this.mapRef.current.leafletElement.getBounds().toBBoxString());
    this.getPlotsGeoJSONData();
  }

  // Call this after map has leafletElement exists to find current location: this.mapRef.current.leafletElement.locate();
  handleLocationFound = e => {
    //this.props.onLocationFound(e.latlng);
  }

  render() {
    const position = [this.state.lat, this.state.lon];
    return (
      <div className="map">
        <Map 
            // crs={leaflet.CRS.EPSG4326}
            center={position} 
            zoom={this.state.zoom}
            style={{ height: '100vh' }}
            onClick={this.handleClick}
            onLocationfound={this.handleLocationFound}
            ref={this.mapRef}>
            <LayersControl position="topright">
              <BaseLayer checked name="OpenStreetMap">
                <TileLayer
                  attribution="&amp;copy <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
              </BaseLayer>              
              <Overlay checked name="BRP Gewaspercelen (WFS)">
                <FeatureGroup>
                  {this.state.features.map(geoJSONData => 
                    <GeoJSON data={geoJSONData} key={geoJSONData.id}></GeoJSON>
                  )}
                </FeatureGroup>
              </Overlay>
              <Overlay checked name="BRP Gewaspercelen (WMS)">
                <WMSTileLayer url="https://geodata.nationaalgeoregister.nl/brpgewaspercelen/wms?" layers="brpgewaspercelen:brpgewaspercelen" 
                  transparent={true} format="image/png" opacity={0.8}>
                </WMSTileLayer>
              </Overlay>
              <Overlay name="gemiddelde toegevoegde waarde per hectare weer van voedselteelten in de akkerbouw (2011-2014)">
                <WMSTileLayer url="http://geodata.rivm.nl/geoserver/wms?" layers="dank:lei_l1a_gc_akkerbvoed" 
                  transparent={true} format="image/png" opacity={0.8}>
                </WMSTileLayer>
              </Overlay>
              <Overlay name="Agrarisch Areaal Nederland (AAN)">
                <WMSTileLayer url="https://geodata.nationaalgeoregister.nl/aan/wms?" layers="aan" 
                  transparent={true} format="image/png" opacity={0.8}>
                </WMSTileLayer>
              </Overlay>
            </LayersControl>
        </Map>
      </div>
    );
  }

}

export default Viewer;
