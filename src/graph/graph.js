import React from "react";
import Plot from "react-plotly.js";

export class Graph extends React.Component {
  render() {
    return (
      <Plot
        config={{
          responsive: true,
          modeBarButtons: [
            []
            // ["zoom2d", "pan2d"],
            // ["zoomIn2d", "zoomOut2d", "autoScale2d"]
          ],
          displaylogo: false
        }}
        data={[
          {
            x: [
              "Januari",
              "Februari",
              "Maart",
              "April",
              "Mei",
              "Juni",
              "Juli",
              "Augustus",
              "September",
              "Oktober",
              "November",
              "December"
            ],
            y: [
              "0.005",
              "0.03",
              "0.09",
              "0.426",
              "0.82",
              "1.69",
              "1.67",
              "1.462",
              "0.90",
              "0.24",
              "0.043",
              "0.008"
            ],
            name: "Pollen",
            type: "bar"
          },
          {
            x: [
              "Januari",
              "Februari",
              "Maart",
              "April",
              "Mei",
              "Juni",
              "Juli",
              "Augustus",
              "September",
              "Oktober",
              "November",
              "December"
            ],
            y: [
              "0.005",
              "0.015",
              "0.07",
              "0.423",
              "0.81",
              "1.18",
              "1.19",
              "1.057",
              "0.894",
              "0.23",
              "0.042",
              "0.008"
            ],
            name: "Nectar",
            type: "bar"
          }
        ]}
        layout={{
          margin: { l: 50, t: 5, r: 40, b: 75 },
          legend: {
            x: 0,
            y: 1
          },
          autosize: true
        }}
      />
    );
  }
}
