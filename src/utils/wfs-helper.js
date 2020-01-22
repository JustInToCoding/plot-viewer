import React from "react";
import produce from "immer";
import { getBounds, getCrs } from "./leaflet-helpers";
import { GeoJSON, FeatureGroup, LayersControl } from "react-leaflet";
import { circleMarker } from "leaflet";

export function initialState(componentContext) {
  return {
    zoom: 10,
    wfsServices: {},
    selectedWfsService: "",
    dragged: false
  };
}

export function createWfs(name, url, resource, typename, minZoom, maxZoom) {
  return { name, url, resource, typename, minZoom, maxZoom, features: [] };
}

export function registerWFS(componentContext, ...wfss) {
  componentContext.setState(
    produce(componentContext.state, draft => {
      draft.selectedWfsService = wfss[0].typename;
      wfss.forEach(wfs => (draft.wfsServices[wfs.typename] = wfs));
    })
  );
  console.log(componentContext.state);
}

export async function retrieveWFSFeatures(componentContext) {
  return Object.entries(componentContext.state.wfsServices)
    .filter(([key, value]) => key === componentContext.state.selectedWfsService)
    .map(([key, value]) => {
      return retrieveFeatures(
        componentContext,
        value.url,
        value.resource,
        value.typename
      );
    });
}

export async function retrieveFeatures(
  componentContext,
  url,
  resource,
  typename
) {
  const bounds = getBounds(componentContext.mapRef);
  const crs = getCrs(componentContext.mapRef);

  componentContext.setState(
    produce(componentContext.state, draft => {
      draft.wfsServices[typename].features = [];
    })
  );
  for await (const features of getPlotsGeoJSONData2(
    componentContext,
    bounds,
    crs,
    url,
    resource,
    typename
  )) {
    const stateFeatures = componentContext.state.wfsServices[typename].features;
    const filteredFeatures = features.filter(
      feature =>
        !stateFeatures.find(stateFeature => feature.id === stateFeature.id)
    );
    componentContext.setState(
      produce(componentContext.state, draft => {
        draft.wfsServices[typename].features.push(...filteredFeatures);
      })
    );
  }
}

async function* getPlotsGeoJSONData2(
  componentContext,
  bounds,
  crs,
  url,
  resource,
  typename
) {
  const southWest = crs.project(bounds.getSouthWest());
  const northEast = crs.project(bounds.getNorthEast());

  const bbox = `${southWest.x},${southWest.y},${northEast.x},${northEast.y}`;

  const wfsUrl = `${url}/${resource}/wfs`;
  const getPlots = startIndex =>
    fetch(
      `${wfsUrl}?SERVICE=WFS&REQUEST=GetFeature&VERSION=2.0.0&TYPENAMES=${typename}&OUTPUTFORMAT=json&STARTINDEX=${startIndex}&COUNT=100&SRSNAME=urn:ogc:def:crs:EPSG::4326&BBOX=${bbox},urn:ogc:def:crs:EPSG::3857`
    );
  const response = await getPlots(0);
  const json = await response.json();
  yield json.features;
  const totalFeatures = json.totalFeatures;
  console.log(totalFeatures);
  while (
    componentContext.state.wfsServices[typename].features.length < totalFeatures
  ) {
    const nextResponse = await getPlots(
      componentContext.state.wfsServices[typename].features.length
    );
    const nextJson = await nextResponse.json();
    yield nextJson.features;
  }
}

export function handleZoomEnd(componentContext) {
  return e => {
    const prev = componentContext.state.zoom;
    const curr = e.target.getZoom();
    console.log(prev, curr);
    const minZoom =
      componentContext.state.wfsServices[
        componentContext.state.selectedWfsService
      ].minZoom;
    const maxZoom =
      componentContext.state.wfsServices[
        componentContext.state.selectedWfsService
      ].maxZoom;
    componentContext.setState(
      produce(componentContext.state, draft => {
        draft.zoom = curr;
      })
    );
    // TODO: Switch statement?
    if (prev < minZoom && curr >= minZoom) {
      retrieveWFSFeatures(componentContext);
      componentContext.setState(
        produce(componentContext.state, draft => {
          draft.dragged = false;
        })
      );
    } else if (prev >= minZoom && curr < minZoom) {
      componentContext.setState(
        produce(componentContext.state, draft => {
          draft.wfsServices[
            componentContext.state.selectedWfsService
          ].features = [];
        })
      );
    } else if (curr === minZoom + 1 && curr < prev) {
      // If zoomed out to the max zoom level then put dragged to false as well
      retrieveWFSFeatures(componentContext);
      componentContext.setState(
        produce(componentContext.state, draft => {
          draft.dragged = false;
        })
      );
    } else if (
      curr >= minZoom &&
      curr < prev &&
      componentContext.state.dragged
    ) {
      // If dragged, then we need to get new BRP on zoom out
      retrieveWFSFeatures(componentContext);
    }
  };
}

export function handleDragEnd(componentContext) {
  return () => {
    const minZoom =
      componentContext.state.wfsServices[
        componentContext.state.selectedWfsService
      ].minZoom;
    const maxZoom =
      componentContext.state.wfsServices[
        componentContext.state.selectedWfsService
      ].maxZoom;
    if (componentContext.state.zoom >= minZoom) {
      retrieveWFSFeatures(componentContext);
      componentContext.setState(
        produce(componentContext.state, draft => {
          draft.dragged = true;
        })
      );
    }
  };
}

export function onPointToLayer(feature, latlng) {
  // console.log(feature.properties.value + 200);
  return circleMarker(latlng, {
    radius: 8,
    fillColor: "#ff7800",
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8
  });
}

export function createFeatureLayers(componentContext, onFeatureClick) {
  return Object.entries(componentContext.state.wfsServices)
    .filter(([key, value]) => key === componentContext.state.selectedWfsService)
    .map(([key, value]) => (
      <FeatureGroup key={key} onClick={onFeatureClick}>
        {value.features.map(geoJSONData => (
          <GeoJSON
            data={geoJSONData}
            key={geoJSONData.id}
            style={{ color: "blue", fillOpacity: 0 }}
            pointToLayer={onPointToLayer}
          />
        ))}
      </FeatureGroup>
    ));
}

export function selectWfsService(componentContext) {
  return e => {
    const minZoom = componentContext.state.wfsServices[e.target.value].minZoom;
    const maxZoom = componentContext.state.wfsServices[e.target.value].maxZoom;
    componentContext.setState(
      produce(componentContext.state, draft => {
        draft.wfsServices[
          componentContext.state.selectedWfsService
        ].features = [];
        draft.selectedWfsService = e.target.value;
      })
    );

    if (componentContext.state.zoom >= minZoom) {
      // Using this so we can use the call back that gets called once react rerendered the component
      componentContext.forceUpdate(() => {
        retrieveWFSFeatures(componentContext);
      });
    }
  };
}

const shorten = (value, maxLength = 18, first = 8, last = 8) => {
  if (value.toString().length <= maxLength) return value;

  const pre = value.toString().substr(0, first);
  const app = value.toString().substr(value.length - last, last);
  return `${pre}...${app}`;
};

export function wfsServiceDropdown(componentContext) {
  return (
    <select
      className="like-leaflet"
      onChange={selectWfsService(componentContext)}
      value={componentContext.state.selectedWfsService}
    >
      {Object.entries(componentContext.state.wfsServices).map(
        ([key, value]) => (
          <option key={key} value={key}>
            {shorten(value.name)}
          </option>
        )
      )}
    </select>
  );
}
