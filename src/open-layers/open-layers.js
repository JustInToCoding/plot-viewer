import React, { PureComponent, createRef } from "react";
import "ol/ol.css";
import "./open-layers.css";
import { Map, View } from "ol";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import OSM from "ol/source/OSM";
import GeoJSON from "ol/format/GeoJSON.js";
import VectorSource from "ol/source/Vector.js";
import { bbox as bboxStrategy } from "ol/loadingstrategy.js";
import { Fill, Stroke, Style } from "ol/style.js";

import Natuur from "../Natuur";
import Bestemmingsplan from "../Bestemmingsplan";
import Selectie from "../Selectie";
import Gemeentegrens from "../Gemeentegrens";
import produce from "immer";

import bij from "../images/bij.png";
import tent from "../images/tent.png";
import tree from "../images/tree.png";
import windmill from "../images/windmill.png";

import logo from "../images/logo.png";

export class OpenLayers extends PureComponent {
  map;
  currentLayer;
  currentLayer2;

  constructor(props) {
    super(props);

    this.state = produce({}, draft => {
      draft.radio = "";
    });
  }

  componentDidMount() {
    const vectorSource = new VectorSource({
      features: new GeoJSON().readFeatures(Gemeentegrens)
    });
    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: new Style({
        stroke: new Stroke({
          color: "rgba(0, 0, 255, 1)",
          width: 2
        })
      })
    });

    this.map = new Map({
      target: "map",
      layers: [
        new TileLayer({
          source: new OSM()
        }),
        vectorLayer
      ],
      view: new View({
        center: [638956.992885993327945, 6826972.975618642754853], // Ede
        zoom: 12
      })
    });
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.radio !== this.state.radio) {
      if (this.currentLayer) {
        this.map.removeLayer(this.currentLayer);
        this.currentLayer = undefined;
      }

      if (this.currentLayer2) {
        this.map.removeLayer(this.currentLayer2);
        this.currentLayer2 = undefined;
      }

      if (this.state.radio === "windmolen") {
        // const vectorSource = new VectorSource({
        //   features: new GeoJSON().readFeatures(Selectie)
        // });
        // this.currentLayer = new VectorLayer({
        //   source: vectorSource,
        //   style: new Style({
        //     fill: new Fill({
        //       color: "rgba(0, 0, 255, 0.4)"
        //     }),
        //     stroke: new Stroke({
        //       color: "rgba(0, 0, 255, 1.0)",
        //       width: 2
        //     })
        //   })
        // });
        // this.map.addLayer(this.currentLayer);
      }

      if (this.state.radio === "voedselbos") {
        let geoJson = { ...Selectie };
        geoJson.features = Selectie.features.filter(
          feature => feature.properties.Selectie === "Voedselbos"
        );

        const vectorSource = new VectorSource({
          features: new GeoJSON().readFeatures(geoJson)
        });
        this.currentLayer = new VectorLayer({
          source: vectorSource,
          style: new Style({
            fill: new Fill({
              color: "rgba(0, 255, 0, 0.4)"
            })
          })
        });

        this.map.addLayer(this.currentLayer);

        let geoJson2 = { ...Selectie };
        geoJson2.features = Selectie.features.filter(
          feature => feature.properties.Selectie !== "Voedselbos"
        );

        const vectorSource2 = new VectorSource({
          features: new GeoJSON().readFeatures(geoJson2)
        });
        this.currentLayer2 = new VectorLayer({
          source: vectorSource2,
          style: new Style({
            fill: new Fill({
              color: "rgba(255, 0, 0, 0.4)"
            })
            // stroke: new Stroke({
            //   color: "rgba(0, 255, 0, 1.0)",
            //   width: 2
            // })
          })
        });

        this.map.addLayer(this.currentLayer2);
      }

      if (this.state.radio === "bijenkast") {
        let geoJson = { ...Selectie };
        geoJson.features = Selectie.features.filter(
          feature => feature.properties.Selectie === "Bijenkast"
        );

        const vectorSource = new VectorSource({
          features: new GeoJSON().readFeatures(geoJson)
        });
        this.currentLayer = new VectorLayer({
          source: vectorSource,
          style: new Style({
            fill: new Fill({
              color: "rgba(0, 255, 0, 0.4)"
            })
          })
        });

        this.map.addLayer(this.currentLayer);

        let geoJson2 = { ...Selectie };
        geoJson2.features = Selectie.features.filter(
          feature => feature.properties.Selectie !== "Bijenkast"
        );

        const vectorSource2 = new VectorSource({
          features: new GeoJSON().readFeatures(geoJson2)
        });
        this.currentLayer2 = new VectorLayer({
          source: vectorSource2,
          style: new Style({
            fill: new Fill({
              color: "rgba(255, 0, 0, 0.4)"
            })
            // stroke: new Stroke({
            //   color: "rgba(0, 255, 0, 1.0)",
            //   width: 2
            // })
          })
        });

        this.map.addLayer(this.currentLayer2);
      }

      if (this.state.radio === "camping") {
      }
    }
  }

  onRadioChange = e => {
    this.setState(
      produce(this.state, draft => {
        draft.radio = e.currentTarget.value;
      })
    );
  };

  render() {
    return (
      <div className="container">
        <div className="side">
          <h1>Regel-Maat</h1>
          <img src={logo} alt="Natuur" className="logo" />
          <div className="radios">
            <p>Kansen:</p>
            <div className="radio-button">
              <input
                type="radio"
                id="windmolen"
                name="kansen"
                value="windmolen"
                checked={this.state.radio === "windmolen"}
                onChange={this.onRadioChange}
              />
              <label htmlFor="windmolen">
                Windmolen{" "}
                <img src={windmill} alt="Windmolen" className="icon" />
              </label>
            </div>
            <div className="radio-button">
              <input
                type="radio"
                id="voedselbos"
                name="kansen"
                value="voedselbos"
                checked={this.state.radio === "voedselbos"}
                onChange={this.onRadioChange}
              />
              <label htmlFor="voedselbos">
                Voedselbos <img src={tree} alt="Natuur" className="icon" />
              </label>
            </div>
            <div className="radio-button">
              <input
                type="radio"
                id="bijenkast"
                name="kansen"
                value="bijenkast"
                checked={this.state.radio === "bijenkast"}
                onChange={this.onRadioChange}
              />
              <label htmlFor="bijenkast">
                Bijenkast <img src={bij} alt="Bijenkast" className="icon" />
              </label>
            </div>
            <div className="radio-button">
              <input
                type="radio"
                id="camping"
                name="kansen"
                value="camping"
                checked={this.state.radio === "camping"}
                onChange={this.onRadioChange}
              />
              <label htmlFor="camping">
                Camping <img src={tent} alt="Camping" className="icon" />
              </label>
            </div>
          </div>
        </div>
        <div id="map" />
      </div>
    );
  }
}
