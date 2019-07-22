import React, { PureComponent, createRef } from "react";

import "./viewer.css";
import "leaflet/dist/leaflet.css";
import {
  Map,
  TileLayer,
  WMSTileLayer,
  LayersControl,
  LayerGroup,
  ZoomControl,
  AttributionControl
} from "react-leaflet";
import produce from "immer";
import {
  createFeatureLayers,
  handleZoomEnd,
  handleDragEnd,
  initialState,
  registerWFS,
  createWfs,
  wfsServiceDropdown
} from "../utils/wfs-helper";

import logo from "../images/BeeSpotLogo.svg";
import locate from "../images/locate.svg";
import { Graph } from "../graph/graph";

const { BaseLayer, Overlay } = LayersControl;

class Viewer extends PureComponent {
  mapRef = createRef();

  selectedLayer;

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
        "Gemeenten",
        "https://geodata.nationaalgeoregister.nl",
        "bestuurlijkegrenzen",
        "bestuurlijkegrenzen:gemeenten",
        11,
        undefined
      ),
      createWfs(
        "BRP Gewaspercelen",
        "https://geodata.nationaalgeoregister.nl",
        "brpgewaspercelen",
        "brpgewaspercelen:brpgewaspercelen",
        14,
        undefined
      ),
      createWfs(
        "Basis registratie Kadaster",
        "https://geodata.nationaalgeoregister.nl",
        "kadastralekaartv3",
        "kadastralekaartv3:perceel",
        14,
        undefined
      ),
      createWfs(
        "Agrarisch Areaal Nederland (AAN)",
        "https://geodata.nationaalgeoregister.nl",
        "aan",
        "aan:aan",
        14,
        undefined
      ),
      createWfs(
        "BAG",
        "https://geodata.nationaalgeoregister.nl/",
        "bag",
        "bag:pand",
        14,
        undefined
      ),
      createWfs(
        "Adressen",
        "https://geodata.nationaalgeoregister.nl/",
        "inspireadressen",
        "inspireadressen:inspireadressen",
        14,
        undefined
      ),
      // Kan alleen xml
      // createWfs(
      //   "Fysisch Geografische Regio’s",
      //   "https://geodata.nationaalgeoregister.nl/",
      //   "fysischgeografischeregios",
      //   "fysischgeografischeregios:fysischgeografischeregios"
      // ),
      createWfs(
        "Bodemkaart 1:50.000",
        "https://geodata.nationaalgeoregister.nl/",
        "bodemkaart50000",
        "bodemkaart50000:bodemkaart50000",
        14,
        undefined
      ),
      // createWfs(
      //   "Bestand bodemgebruik (CBS)",
      //   "https://geodata.nationaalgeoregister.nl/",
      //   "bestandbodemgebruik2015",
      //   "bestandbodemgebruik2015:bbg2015_hoofdgroep"
      // ),
      createWfs(
        "Landsgrens",
        "https://geodata.nationaalgeoregister.nl",
        "bestuurlijkegrenzen",
        "bestuurlijkegrenzen:landsgrens",
        2,
        undefined
      ),
      createWfs(
        "Provincies",
        "https://geodata.nationaalgeoregister.nl",
        "bestuurlijkegrenzen",
        "bestuurlijkegrenzen:provincies",
        2,
        undefined
      )
    );
  }

  handleFeatureClick = e => {
    if (this.selectedLayer) {
      this.selectedLayer.setStyle({
        color: "blue",
        fillOpacity: 0
      });
    }
    this.selectedLayer = e.layer;
    this.selectedLayer.setStyle({
      color: "red",
      fillOpacity: 0.2
    });

    this.selectedLayer.bringToFront();
    console.log(e.layer.feature);
  };

  locateUser = () => {
    this.mapRef.current.leafletElement.locate({ setView: true, maxZoom: 13 });
  };

  render() {
    const position = [this.state.lat, this.state.lon];
    return (
      <>
        <div className="map">
          <div className="like-leaflet logo">
            <img src={logo} alt="logo" />
            {/* <header>BEESPOT</header> */}
          </div>
          <div className="wfs-dropdown">{wfsServiceDropdown(this)}</div>
          <div className="like-leaflet locate" onClick={this.locateUser}>
            <img src={locate} alt="locate" />
          </div>
          <Map
            center={position}
            zoom={this.state.zoom}
            onZoomEnd={handleZoomEnd(this)}
            onDragEnd={handleDragEnd(this)}
            onClick={this.handleClick}
            onLocationfound={this.handleLocationFound}
            ref={this.mapRef}
            className="leaflet-map"
            zoomControl={false}
            attributionControl={false}
          >
            <AttributionControl position="topright" />
            <ZoomControl position="bottomright" />
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
              <Overlay checked name="Kilometer vakken">
                <WMSTileLayer
                  url="https://geoserver.has.nl/geoserver/food4bees/wms?"
                  layers="food4bees:kmvakmetdrachtwaardecombi_v1"
                  tiled={true}
                  transparent={true}
                  format="image/png"
                  serverType="geoserver"
                  opacity={0.9}
                  version="1.3.0"
                  attribution='&amp;copy <a href="http://www.food4bees.com/">Food4Bees</a>'
                />
              </Overlay>
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
              {/* <Overlay checked name="geoJson">
                <GeoJSON data={this.geoJson} />
              </Overlay> */}
            </LayersControl>
            {createFeatureLayers(this, this.handleFeatureClick)}
          </Map>
        </div>
        <div className="charts">
          <Graph />
        </div>
      </>
    );
  }
}

export default Viewer;
