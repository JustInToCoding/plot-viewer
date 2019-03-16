import React, { PureComponent, createRef } from "react";

import "./viewer.css";
import "leaflet/dist/leaflet.css";
import {
  Map,
  TileLayer,
  WMSTileLayer,
  GeoJSON,
  LayersControl,
  LayerGroup
} from "react-leaflet";
import produce from "immer";
import {
  retrieveFeatures,
  createFeatureLayers,
  handleZoomEnd,
  handleDragEnd,
  setState,
  initialState,
  registerWFS,
  createWfs
} from "../utils/wfs-helper";

import Natuur from "../Natuur";
import Bestemmingsplan from "../Bestemmingsplan";

const { BaseLayer, Overlay } = LayersControl;

class Viewer extends PureComponent {
  mapRef = createRef();

  selectedLayer;

  geoJson = Natuur;

  constructor(props) {
    super(props);

    this.state = produce(initialState(), draft => {
      draft.lat = 51.84276079;
      draft.lon = 5.18380148;
    });
  }

  componentDidMount() {
    registerWFS(
      this,
      createWfs(
        "BRP Gewaspercelen",
        "https://geodata.nationaalgeoregister.nl",
        "brpgewaspercelen",
        "brpgewaspercelen:brpgewaspercelen"
      ),
      createWfs(
        "Basis registratie Kadaster",
        "https://geodata.nationaalgeoregister.nl",
        "kadastralekaartv3",
        "kadastralekaartv3:perceel"
      )
    );
  }

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

  render() {
    const position = [this.state.lat, this.state.lon];
    return (
      <div className="map">
        <div className="sideBar">test</div>
        {/* <select>
          {Object.entries(this.state.wfsServices).map(([key, value]) => (
            <option key={key} value={key}>
              {value.name}
            </option>
          ))}
        </select> */}
        <Map
          center={position}
          zoom={this.state.zoom}
          onZoomEnd={handleZoomEnd(this)}
          onDragEnd={handleDragEnd(this)}
          style={{ height: "100vh" }}
          onClick={this.handleClick}
          onLocationfound={this.handleLocationFound}
          ref={this.mapRef}
        >
          <LayersControl position="topright">
            <BaseLayer name="OpenStreetMap">
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
            <BaseLayer checked name="Luchtfoto">
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
            {createFeatureLayers(this, this.handleFeatureClick)}
            <Overlay name="BRP Gewaspercelen (WMS)">
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
            <Overlay name="Bestand bodemgebruik">
              <WMSTileLayer
                url="https://geodata.nationaalgeoregister.nl/bestandbodemgebruik2015/wms"
                layers="bbg2015"
                transparent={true}
                format="image/png"
                opacity={0.8}
              />
            </Overlay>
            <Overlay checked name="geoJson">
              <GeoJSON data={this.geoJson} />
            </Overlay>
          </LayersControl>
        </Map>
      </div>
    );
  }
}

export default Viewer;
