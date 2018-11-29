import React, { PureComponent, createRef } from "react";

import "./viewer.css";
import "leaflet/dist/leaflet.css";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerRetinaIcon from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import {
  Map,
  TileLayer,
  WMSTileLayer,
  GeoJSON,
  LayersControl,
  FeatureGroup,
  LayerGroup
} from "react-leaflet";
import leaflet from "leaflet";
import produce from "immer";
import gpsjson from "../gps";
import L from "leaflet";
// import jQuery from "jquery";
// window.$ = jQuery;
// // eslint-disable-next-line import/first
// import "../LeafletPlayback";

const { BaseLayer, Overlay } = LayersControl;

class Viewer extends PureComponent {
  icon;

  mapRef = createRef();

  selectedLayer;

  geoJson;

  constructor(props) {
    super(props);

    this.state = produce({}, draft => {
      draft.zoom = 10;
      draft.hasLocation = false;
      draft.lat = 51.84276079;
      draft.lon = 5.18380148;
      draft.features = {};
    });

    this.icon = leaflet.icon({
      iconUrl: markerIcon,
      shadowUrl: markerShadow,
      iconRetinaUrl: markerRetinaIcon,

      iconSize: [25, 41], // size of the icon
      shadowSize: [41, 41], // size of the shadow
      iconAnchor: [12, 41], // point of the icon which will correspond to marker's location
      shadowAnchor: [12, 41], // the same for the shadow
      popupAnchor: [1, -34], // point from which the popup should open relative to the iconAnchor
      tooltipAnchor: [16, -28]
    });

    let gpsjson2 = gpsjson;
    let coordinates = gpsjson2.map(coord => [coord.lng, coord.lat]);
    let times = gpsjson2.map(coord => coord.time + "000");
    this.geoJson = {
      type: "Feature",
      geometry: {
        type: "MultiPoint",
        coordinates: coordinates
      },
      properties: {
        time: times
      }
    };
  }

  componentDidMount() {
    // // Playback options
    // var playbackOptions = {
    //   playControl: true,
    //   dateControl: true,
    //   sliderControl: true
    // };
    // // Initialize playback
    // var playback = new L.Playback(
    //   this.mapRef.current.leafletElement,
    //   this.geoJson,
    //   null,
    //   playbackOptions
    // );
  }

  async *getPlotsGeoJSONData2(bounds, crs, url, resource) {
    const southWest = crs.project(bounds.getSouthWest());
    const northEast = crs.project(bounds.getNorthEast());

    const bbox = `${southWest.x},${southWest.y},${northEast.x},${northEast.y}`;

    const wfsUrl = `${url}/${resource}/wfs`;
    const getPlots = startIndex =>
      fetch(
        `${wfsUrl}?SERVICE=WFS&REQUEST=GetFeature&VERSION=2.0.0&TYPENAMES=brpgewaspercelen:brpgewaspercelen&OUTPUTFORMAT=json&STARTINDEX=${startIndex}&COUNT=200&SRSNAME=urn:ogc:def:crs:EPSG::4326&BBOX=${bbox},urn:ogc:def:crs:EPSG::3857`
      );
    const response = await getPlots(0);
    const json = await response.json();
    yield json.features;
    const totalFeatures = json.totalFeatures;
    while (this.state.features[resource].length < totalFeatures) {
      const nextResponse = await getPlots(this.state.features[resource].length);
      const nextJson = await nextResponse.json();
      yield nextJson.features;
    }
  }

  getBounds() {
    const bounds = this.mapRef.current.leafletElement.getBounds();
    return bounds;
  }

  getCrs() {
    const crs = this.mapRef.current.leafletElement.options.crs;
    return crs;
  }

  async retrieveFeatures(url, resource) {
    this.setState(
      produce(this.state, draft => {
        draft.features[resource] = [];
      })
    );
    for await (const features of this.getPlotsGeoJSONData2(
      this.getBounds(),
      this.getCrs(),
      url,
      resource
    )) {
      const stateFeatures = this.state.features[resource];
      const filteredFeatures = features.filter(
        feature =>
          !stateFeatures.find(stateFeature => feature.id === stateFeature.id)
      );
      this.setState(
        produce(this.state, draft => {
          draft.features[resource].push(...filteredFeatures);
        })
      );
    }
  }

  getBrp() {
    this.retrieveFeatures(
      "https://geodata.nationaalgeoregister.nl",
      "brpgewaspercelen"
    );
  }

  async getPlotsGeoJSONData() {
    this.setState(
      produce(this.state, draft => {
        draft.features = [];
      })
    );

    const bounds = this.mapRef.current.leafletElement.getBounds();
    // TODO: Remember for which bounds we got the plots,
    // so that we can check if bounds are within the last bounds we got the plots for,
    // so we don't have to get the plots again

    const crs = this.mapRef.current.leafletElement.options.crs;
    const southWest = crs.project(bounds.getSouthWest());
    const northEast = crs.project(bounds.getNorthEast());

    const bbox = `${southWest.x},${southWest.y},${northEast.x},${northEast.y}`;

    const wfsUrl =
      "https://geodata.nationaalgeoregister.nl/brpgewaspercelen/wfs";
    const getPlots = startIndex =>
      fetch(
        `${wfsUrl}?SERVICE=WFS&REQUEST=GetFeature&VERSION=2.0.0&TYPENAMES=brpgewaspercelen:brpgewaspercelen&OUTPUTFORMAT=json&STARTINDEX=${startIndex}&COUNT=200&SRSNAME=urn:ogc:def:crs:EPSG::4326&BBOX=${bbox},urn:ogc:def:crs:EPSG::3857`
      );
    const response = await getPlots(0);
    const json = await response.json();
    this.setState(
      produce(this.state, draft => {
        draft.features.push(...json.features);
      })
    );
    const totalFeatures = json.totalFeatures;
    while (this.state.features.length < totalFeatures) {
      const nextResponse = await getPlots(this.state.features.length);
      const nextJson = await nextResponse.json();
      const stateFeatures = this.state.features;
      const features = nextJson.features.filter(
        feature =>
          !stateFeatures.find(stateFeature => feature.id === stateFeature.id)
      );
      this.setState(
        produce(this.state, draft => {
          draft.features.push(...features);
        })
      );
    }
  }

  handleZoomEnd = e => {
    const prev = this.state.zoom;
    const curr = e.target.getZoom();
    if (prev < 15 && curr > 14) {
      this.setState(
        produce(this.state, draft => {
          draft.zoom = curr;
        })
      );
      this.getBrp();
    }
    if (prev > 14 && curr < 15) {
      this.setState(
        produce(this.state, draft => {
          draft.zoom = curr;
          draft.features = {};
        })
      );
    }
  };

  handleDragEnd = () => {
    if (this.state.zoom > 14) {
      this.getBrp();
    }
  };

  handleClick = e => {
    //this.props.onLocationFound(e.latlng);
    // console.log(this.mapRef.current.leafletElement.getBounds().toBBoxString());
    // this.getPlotsGeoJSONData();
  };

  // Call this after map has leafletElement exists to find current location: this.mapRef.current.leafletElement.locate();
  handleLocationFound = e => {
    //this.props.onLocationFound(e.latlng);
  };

  handleFeatureClick = e => {
    if (this.selectedLayer) {
      this.selectedLayer.setStyle({
        color: "blue"
      });
    }
    this.selectedLayer = e.layer;
    this.selectedLayer.setStyle({
      color: "red"
    });

    console.log(e);
  };

  onPointToLayer = (feature, latlng) => {
    // console.log(feature.properties.value + 200);

    return L.circleMarker(latlng, {
      radius: 8,
      fillColor: "#ff7800", // TODO set color based on hitch values?? // this.perc2color(this.valueToPerc(feature.properties.value)), //
      color: "#000",
      weight: 1,
      opacity: 1,
      fillOpacity: 0.8
    });
  };

  render() {
    const position = [this.state.lat, this.state.lon];
    return (
      <div className="map">
        <Map
          center={position}
          zoom={this.state.zoom}
          onZoomEnd={this.handleZoomEnd}
          onDragEnd={this.handleDragEnd}
          style={{ height: "100vh" }}
          onClick={this.handleClick}
          onLocationfound={this.handleLocationFound}
          ref={this.mapRef}
        >
          <LayersControl position="topright">
            <BaseLayer checked name="OpenStreetMap">
              <TileLayer
                attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
            </BaseLayer>
            {/* <BaseLayer name="Test">
                <TileLayer
                  attribution="&amp;copy PDOK"
                  url="https://geodata.nationaalgeoregister.nl/luchtfoto/infrarood/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=Actueel_ortho25IR&STYLE=default&TILEMATRIXSET=EPSG:3857&TILEMATRIX={z}&TILEROW={x}&TILECOL={y}&FORMAT=image%2Fpng"
                />
              </BaseLayer> */}
            <BaseLayer name="Luchtfoto">
              <LayerGroup>
                <WMSTileLayer
                  url="https://geodata.nationaalgeoregister.nl/luchtfoto/rgb/wms?"
                  layers="Actueel_ortho25"
                />
                {/* <TileLayer
                    url="https://geodata.nationaalgeoregister.nl/tiles/service/tms/1.0.0/lufolabels/EPSG:28992/{z}/{x}/{y}.png"
                    tms={true}
                  /> */}
              </LayerGroup>
            </BaseLayer>
            <BaseLayer name="Luchtfoto Infrarood">
              <WMSTileLayer
                url="https://geodata.nationaalgeoregister.nl/luchtfoto/infrarood/wms?"
                layers="Actueel_ortho25IR"
              />
            </BaseLayer>
            <Overlay checked name="BRP Gewaspercelen (WFS)">
              <FeatureGroup onClick={this.handleFeatureClick}>
                {this.state.features.brpgewaspercelen
                  ? this.state.features.brpgewaspercelen.map(geoJSONData => (
                      <GeoJSON
                        data={geoJSONData}
                        key={geoJSONData.id}
                        style={{ color: "blue" }}
                      />
                    ))
                  : undefined}
              </FeatureGroup>
            </Overlay>
            <Overlay checked name="BRP Gewaspercelen (WMS)">
              <WMSTileLayer
                url="https://geodata.nationaalgeoregister.nl/brpgewaspercelen/wms?"
                layers="brpgewaspercelen:brpgewaspercelen"
                transparent={true}
                format="image/png"
                opacity={0.8}
              />
            </Overlay>
            <Overlay name="gemiddelde toegevoegde waarde per hectare weer van voedselteelten in de akkerbouw (2011-2014)">
              <WMSTileLayer
                url="http://geodata.rivm.nl/geoserver/wms?"
                layers="dank:lei_l1a_gc_akkerbvoed"
                transparent={true}
                format="image/png"
                opacity={0.8}
              />
            </Overlay>
            <Overlay name="Agrarisch Areaal Nederland (AAN)">
              <WMSTileLayer
                url="https://geodata.nationaalgeoregister.nl/aan/wms?"
                layers="aan"
                transparent={true}
                format="image/png"
                opacity={0.8}
              />
            </Overlay>
            <Overlay name="Actueel Hoogtebestand Nederland 3">
              <WMSTileLayer
                url="https://geodata.nationaalgeoregister.nl/ahn3/wms"
                layers="ahn3_05m_dsm"
                transparent={true}
                format="image/png"
                opacity={0.8}
              />
            </Overlay>
            <Overlay checked name="geoJson">
              <GeoJSON data={this.geoJson} pointToLayer={this.onPointToLayer} />
            </Overlay>
          </LayersControl>
        </Map>
      </div>
    );
  }
}

export default Viewer;
