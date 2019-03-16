import React from "react";
import produce from "immer";
import { getBounds, getCrs } from "./leaflet-helpers";
import { GeoJSON, FeatureGroup, LayersControl } from "react-leaflet";
const { Overlay } = LayersControl;

export function initialState(componentContext) {
  return {
    zoom: 10,
    wfsServices: {},
    dragged: false
  };
}

export function createWfs(name, url, resource, typename) {
  return { name, url, resource, typename, features: [], selected: false };
}

export function registerWFS(componentContext, ...wfss) {
  componentContext.setState(
    produce(componentContext.state, draft => {
      wfss.forEach(wfs => (draft.wfsServices[wfs.resource] = wfs));
    })
  );
  console.log(componentContext.state);
}

export async function retrieveWFSFeatures(componentContext) {
  return Object.entries(componentContext.state.wfsServices).map(
    ([key, value]) => {
      return retrieveFeatures(componentContext, value.url, key, value.typename);
    }
  );
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
      draft.wfsServices[resource].features = [];
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
    const stateFeatures = componentContext.state.wfsServices[resource].features;
    const filteredFeatures = features.filter(
      feature =>
        !stateFeatures.find(stateFeature => feature.id === stateFeature.id)
    );
    componentContext.setState(
      produce(componentContext.state, draft => {
        draft.wfsServices[resource].features.push(...filteredFeatures);
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
  name
) {
  const southWest = crs.project(bounds.getSouthWest());
  const northEast = crs.project(bounds.getNorthEast());

  const bbox = `${southWest.x},${southWest.y},${northEast.x},${northEast.y}`;

  const wfsUrl = `${url}/${resource}/wfs`;
  const getPlots = startIndex =>
    fetch(
      `${wfsUrl}?SERVICE=WFS&REQUEST=GetFeature&VERSION=2.0.0&TYPENAMES=${name}&OUTPUTFORMAT=json&STARTINDEX=${startIndex}&COUNT=200&SRSNAME=urn:ogc:def:crs:EPSG::4326&BBOX=${bbox},urn:ogc:def:crs:EPSG::3857`
    );
  const response = await getPlots(0);
  const json = await response.json();
  yield json.features;
  const totalFeatures = json.totalFeatures;
  while (
    componentContext.state.wfsServices[resource].features.length < totalFeatures
  ) {
    const nextResponse = await getPlots(
      componentContext.state.wfsServices[resource].features.length
    );
    const nextJson = await nextResponse.json();
    yield nextJson.features;
  }
}

export function handleZoomEnd(componentContext) {
  return e => {
    const prev = componentContext.state.zoom;
    const curr = e.target.getZoom();
    componentContext.setState(
      produce(componentContext.state, draft => {
        draft.zoom = curr;
      })
    );
    // TODO: Switch statement?
    if (prev < 15 && curr > 14) {
      retrieveWFSFeatures(componentContext);
      componentContext.setState(
        produce(componentContext.state, draft => {
          draft.dragged = false;
        })
      );
    } else if (prev > 14 && curr < 15) {
      componentContext.setState(
        produce(componentContext.state, draft => {
          draft.features = {};
        })
      );
    } else if (curr === 15 && curr < prev) {
      // If zoomed out to the max zoom level then put dragged to false as well
      retrieveWFSFeatures(componentContext);
      componentContext.setState(
        produce(componentContext.state, draft => {
          draft.dragged = false;
        })
      );
    } else if (curr > 14 && curr < prev && componentContext.state.dragged) {
      // If dragged, then we need to get new BRP on zoom out
      retrieveWFSFeatures(componentContext);
    }
  };
}

export function handleDragEnd(componentContext) {
  return () => {
    if (componentContext.state.zoom > 14) {
      retrieveWFSFeatures(componentContext);
      componentContext.setState(
        produce(componentContext.state, draft => {
          draft.dragged = true;
        })
      );
    }
  };
}

export function createFeatureLayers(componentContext, onFeatureClick) {
  return Object.entries(componentContext.state.wfsServices).map(
    ([key, value]) => (
      <Overlay key={key} name={`${value.name} (WFS)`}>
        <FeatureGroup onClick={onFeatureClick}>
          {value.features.map(geoJSONData => (
            <GeoJSON
              data={geoJSONData}
              key={geoJSONData.id}
              style={{ color: "blue" }}
            />
          ))}
        </FeatureGroup>
      </Overlay>
    )
  );
}
