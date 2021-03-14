// Initialise elements on page
// Enabling button Show table
$("#citiesCoordModal").on("shown.bs.modal", function () {
  $("#myInput").focus();
});
// Enabling button Show legend
$("#legendModal").on("shown.bs.modal", function () {
  $("#myInput").focus();
});
$("#radius_slider").slider({
  tooltip_position: "bottom",
});
$("#radius_slider").on("slide", function (slideEvt) {
  $("#radius_sliderSliderVal").text(slideEvt.value);
});
function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}
// Async load js from code
jQuery.loadScript = function (url, callback) {
  jQuery.ajax({
    url: url,
    dataType: "script",
    success: callback,
    async: true,
  });
};
function getRandomColor() {
  var letters = "0123456789ABCDEF";
  var color = "#";
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}
var colorWell = [];
var colors = [
  "#FF0000",
  "#00CC33",
  "#0099FF",
  "#FFFF33",
  "#FFCC00",
  "#FF9933",
  "#990033",
  "#CC9999",
  "#993399",
  "#FF99FF",
  "#9900FF",
  "#9999FF",
  "#000099",
  "#006666",
  "#00FFFF",
  "#006600",
  "#996600",
  "#66FF00",
  "#99CC33",
  "#CCCC33",
  "#666600",
  "#CCCCCC",
];
var MARKER_ICON = "default";
var MARKER_COLOR = "blue";
var geo = new google.maps.Geocoder();
var cities = [];
var markersLayer = new L.LayerGroup();
var nextAddress = 0;
var delay = 1000;
var cities_list = [];
var piechartLayer = new L.PieChartDataLayer();
var piechartarray = [];
var alltxt = [];
var PieChart = false;
var IS_GOOGLE = "google";
var IS_SHOW_LEGEND = true; // default value showing the legend
var geojson = new L.geoJson();
var Legend = L.control({ position: "bottomright" });
var legendShape = L.control({ position: "bottomright" });
var nodataflag = false;
var grades = [0, 10, 20, 50, 100, 200, 500, 1000];
var RFregionsData;
// Links to map sources
var yandexMap = L.tileLayer(
  "https://vec{s}.maps.yandex.net/tiles?l=map&v=4.55.2&z={z}&x={x}&y={y}&scale=2&lang=ru_RU",
  {
    subdomains: ["01", "02", "03", "04"],
    reuseTiles: true,
    updateWhenIdle: false,
  }
);
var yandexMapEng = L.tileLayer(
  "https://vec{s}.maps.yandex.net/tiles?l=map&v=4.55.2&z={z}&x={x}&y={y}&scale=2&lang=en_US",
  {
    subdomains: ["01", "02", "03", "04"],
    reuseTiles: true,
    updateWhenIdle: false,
  }
);
var osmMap = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png");
var roadsMap = L.tileLayer(
  "https://korona.geog.uni-heidelberg.de/tiles/roads/x={x}&y={y}&z={z}"
);
var stamMap = L.tileLayer(
  "https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}.{ext}",
  { subdomains: "abcd", minZoom: 0, maxZoom: 20, ext: "png" }
);
var esriMap = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
);
var googleStreets = L.tileLayer(
  "https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
  { maxZoom: 20, subdomains: ["mt0", "mt1", "mt2", "mt3"] }
);
// Initialize map
var map = L.map("map", {
  center: [56.73, 36.99],
  zoom: 6,
  layers: [yandexMap],
  fullscreenControl: true,
  fullscreenControlOptions: {
    position: "topleft",
  },
});
var baseMaps = {
  "Yandex Map": yandexMap,
  "Yandex Map ENG": yandexMapEng,
  "Google Map": googleStreets,
  "Open Street Map": osmMap,
  "Toner Map": stamMap,
};
// Attach layers to map
map.options.crs = L.CRS.EPSG3395;
L.control.layers(baseMaps).addTo(map);
markersLayer.addTo(map);
// Add print button
L.easyButton(
  '<span class="glyphicon glyphicon glyphicon-save" aria-hidden="true"></span>',
  function (btn, map) {
    printLeaflet();
  }
).addTo(map);
// Смена типа карты в правом верхнем углу
map.on("baselayerchange", function (event) {
  if (event.name == "Yandex Map" || event.name == "Yandex Map ENG") {
    map.options.crs = L.CRS.EPSG3395;
  } else {
    map.options.crs = L.CRS.EPSG3857;
  }
  clearMap();
  if (PieChart == false) {
    cities.forEach(function (city) {
      markersLayer.addLayer(
        L.marker([city.lat, city.lon]).bindPopup(city.fullname)
      );
    });
  } else {
    redrawPieChart();
  }
});
var setGeocodeMode = function (val) {
  IS_GOOGLE = val;
};
var setMarkerIcon = function (val) {
  MARKER_ICON = val;
  updateMap();
};
var setMarkerColor = function (val) {
  MARKER_COLOR = val;
  updateMap();
};
var showLoading = function (val) {
  if (val) {
    $("div.spanner").addClass("show");
    $("div.overlay").addClass("show");
  } else {
    $("div.spanner").removeClass("show");
    $("div.overlay").removeClass("show");
  }
  document.getElementById("txtLoading").innerHTML = "";
};

var setCurrentLoading = function (msg) {
  document.getElementById("txtLoading").innerHTML = msg;
};

// Pin markers on map based on cities
var updateMap = function () {
  if (cities.length == 0) return;

  var bounds = [];
  clearMap();

  var redMarker = L.AwesomeMarkers.icon({
    icon: "coffee",
    markerColor: "red",
  });

  cities.forEach(function (city) {
    var marker;
    if (MARKER_ICON !== "default") {
      marker = L.marker([city.lat, city.lon], {
        icon: L.AwesomeMarkers.icon({
          icon: MARKER_ICON,
          markerColor: MARKER_COLOR,
        }),
        draggable: true,
      });
    } else {
      marker = L.marker([city.lat, city.lon]);
    }

    marker.bindPopup(city.fullname);

    if (label_toggle.checked) {
      marker.bindTooltip(city.txtName, {
        className: "myCSSClass",
        permanent: true,
        direction: "bottom",
      });
    }

    markersLayer.addLayer(marker);

    bounds.push([city.lat, city.lon]);
  });

  var group = new L.LatLngBounds(bounds);
  map.fitBounds(group);
};

$(function () {
  $("#label_toggle").change(function () {
    updateMap();
  });
});

function logErr(status, search) {
  var reason = "Code " + status;
  var msg = 'error = "' + search + '"<br>';
  if (PieChart == false) {
    document.getElementById("messagesPin").innerHTML += msg;
  } else {
    document.getElementById("messagesPie").innerHTML += msg;
  }
  console.log(msg);
}

// Show cities coordinates on modal table
var fillTable = function () {
  document.getElementById("citiesTable").innerHTML = "";
  var tbody = $("#citiesTable");
  var props = ["txtName", "fullname", "lat", "lon"];
  // Write table head
  var th = $("<thead>");
  var tr = $("<tr>");
  $("<th>").html("Object").appendTo(tr);
  $("<th>").html("Address").appendTo(tr);
  $("<th>").html("Latitude").appendTo(tr);
  $("<th>").html("Longitude").appendTo(tr);
  th.append(tr);
  tbody.append(th);
  //Write table data
  var tb = $("<tbody>");
  $.each(cities, function (i, city) {
    var tr = $("<tr>");
    $.each(props, function (i, prop) {
      $("<td>").html(city[prop]).appendTo(tr);
    });
    tb.append(tr);
  });
  tbody.append(tb);
};

// Show cities stat on modal table
var fillTableStat = function (arr) {
  document.getElementById("citiesTableStat").innerHTML = "";
  var tbody = $("#citiesTableStat");
  var props = ["name", "count", "perc"];
  // Write table head
  var th = $("<thead>");
  var tr = $("<tr>");
  $("<th>").html("Name").appendTo(tr);
  $("<th>").html("Count").appendTo(tr);
  $("<th>").html("Percent").appendTo(tr);
  th.append(tr);
  tbody.append(th);
  //Write table data
  var tb = $("<tbody>");
  $.each(arr, function (i, val) {
    var tr = $("<tr>");
    $.each(props, function (i, prop) {
      $("<td>").html(val[prop]).appendTo(tr);
    });
    tb.append(tr);
  });
  tbody.append(tb);
};

//Change radius-toggle
$(function () {
  $("#radius_toggle").change(function () {
    if (radius_toggle.checked) {
      $("#radius_slider").slider("setValue", 31);
    } else {
      $("#radius_slider").slider("setValue", 17);
    }
    redrawPieChart();
  });
});
//Change radius-slider
$("#radius_slider").on("slide", function (slideEvt) {
  redrawPieChart();
});
function clearMap() {
  markersLayer.clearLayers();
  piechartLayer.clearLayers();
}
function ShowLegendOnMap() {
  if (IS_SHOW_LEGEND === true) {
    $(".legend").hide();
    IS_SHOW_LEGEND = false;
  } else {
    $(".legend").show();
    IS_SHOW_LEGEND = true;
  }
}
function printLeaflet() {
  $(".leaflet-top.leaflet-left").hide();
  $(".leaflet-top.leaflet-right").hide();
  showLoading(true);
  setCurrentLoading("Creating image");
  var el = document.getElementById("map");
  var width = el.offsetWidth;
  var height = el.offsetHeight;
  domtoimage.toBlob(el, { width, height }).then(function (blob) {
    window.saveAs(blob, "map.png");
    $(".leaflet-top.leaflet-left").show();
    $(".leaflet-top.leaflet-right").show();
    showLoading(false);
  });
}
function setExaplePie() {
  document.getElementById("txtPiechart").value =
    "Moscow\tFirst\t69\nMoscow\tSecond\t72\nSt.Petersburg\tFirst\t10\nSt.Petersburg\tSecond\t25\nSt.Petersburg\tThird\t17";
}
function getDatafromTxt(val) {
  if (val != "") {
    PieChart = true;
    showLoading(true);
    nextAddress = 0;
    delay = 1000;
    cities = [];
    alltxt = [];
    piechartarray = [];
    var records_list = val.trim().split(/\r?\n/);
    var current_data = [];
    for (var i = 0; i < records_list.length; i++) {
      current_data[i] = {
        city: records_list[i].trim().split(/\t/)[0],
        txt: records_list[i].trim().split(/\t/)[1],
        val: records_list[i].trim().split(/\t/)[2],
      };
    }
    var countarray = [];
    for (var i = 0; i < records_list.length; i++) {
      if (alltxt.indexOf(current_data[i].txt) == -1) {
        alltxt.push(current_data[i].txt);
        countarray.push(0);
      }
    }
    while (alltxt.length > colors.length) {
      colors.push(getRandomColor());
    }
    for (var i = 0; i < records_list.length; i++) {
      if (
        piechartarray.map((x) => x.City).indexOf(current_data[i].city) == -1
      ) {
        piechartarray.push({
          City: current_data[i].city,
          fullname: "",
          Latitude: 0,
          Longitude: 0,
          Count: countarray.slice(),
          Total: parseFloat(current_data[i].val),
        });
      } else {
        piechartarray[
          piechartarray.map((x) => x.City).indexOf(current_data[i].city)
        ].Total += parseFloat(current_data[i].val);
      }
    }
    for (var i = 0; i < current_data.length; i++) {
      piechartarray[
        piechartarray.map((x) => x.City).indexOf(current_data[i].city)
      ].Count[alltxt.indexOf(current_data[i].txt)] = current_data[i].val;
    }
    document.getElementById("messagesPie").innerHTML = "";
    theNext();
  } else {
    document.getElementById("messagesPie").innerHTML = "Empty string!";
  }
}
function makePiechart() {
  var bounds = [];
  clearMap();
  $("#radius_toggle").bootstrapToggle("enable");
  $("#radius_slider").slider("enable");
  document.getElementById("btnShowLegendOnMap").disabled = false;
  //Удаляем нераспознанные города из массива маркеров
  while (piechartarray.length != cities.length) {
    for (var i = 0; i < piechartarray.length; i++) {
      if (cities.map((x) => x.txtName).indexOf(piechartarray[i].City) == -1) {
        piechartarray.splice(i, 1);
      }
    }
  }
  //Заносим в массив маркеров значения широты и долготы
  for (var i = 0; i < cities.length; i++) {
    var x = piechartarray.map((x) => x.City).indexOf(cities[i].txtName);
    piechartarray[x].Latitude = cities[i].lat;
    piechartarray[x].Longitude = cities[i].lon;
    piechartarray[x].fullname = cities[i].fullname;
    bounds.push([cities[i].lat, cities[i].lon]);
  }
  var max = Math.max.apply(
    Math,
    piechartarray.map(function (o) {
      return o.Total;
    })
  );
  var min = Math.min.apply(
    Math,
    piechartarray.map(function (o) {
      return o.Total;
    })
  );
  for (var i = piechartarray.length - 1; i >= 0; i--) {
    var data = {};
    var chartOptions = {};
    if (radius_toggle.checked) {
      var radius =
        9 +
        ((parseInt(radius_slider.value) - 8) * (piechartarray[i].Total - min)) /
          (max - min);
      if (!radius) {
        radius = 15;
      }
    } else {
      radius = parseInt(radius_slider.value);
    }
    for (var j = 0; j < alltxt.length; j++) {
      if (piechartarray[i].Count[j] != 0) {
        (data[alltxt[j].trim()] =
          piechartarray[i].Count[j] / piechartarray[i].Total),
          (chartOptions[alltxt[j].trim()] = {
            fillColor: colors[j],
            color: "#000000",
            displayText: function (value) {
              return (value * 100).toFixed(1).toString() + "%";
            },
          });
      }
    }
    var options = {
      radius: radius,
      fillOpacity: 1,
      data: data,
      chartOptions: chartOptions,
    };
    var bchMarker = new L.PieChartMarker(
      new L.LatLng(piechartarray[i].Latitude, piechartarray[i].Longitude),
      options
    );
    var str =
      "<h5>" +
      piechartarray[i].fullname +
      '</h5><table class="table table-condensed"><tr><th>Item</th><th  style="width: 64px;">Count</th></tr>';
    for (var j = 0; j < alltxt.length; j++) {
      if (piechartarray[i].Count[j] != 0) {
        str += "<tr>";
        str +=
          '<td style="font-weight: bold;"><div class="data-layer-legend"><div class="legend-box" style="background-color:' +
          colors[j] +
          ';"></div><div class="key">' +
          alltxt[j] +
          "</div></div></td>";
        str +=
          "<td  style='width: 64px;'>" + piechartarray[i].Count[j] + "</td>";
        str += "</tr>";
      }
    }
    str += "</table>";
    bchMarker.bindPopup(str, {
      minWidth: 400,
    });
    bchMarker.addTo(piechartLayer);
  }
  //Добавляем итоговый слой PieChart маркеров на карту
  map.addLayer(piechartLayer);
  //Добавляем легенду на ShowModal
  $("#legend").html("");
  //var str = "<ul>";
  //for (var j = 0; j < alltxt.length; j++) {
  //    var sum = 0;
  //    for (var i = 0; i < piechartarray.length; i++) { sum += parseInt(piechartarray[i].Count[j]); }
  //    str += "<li><div class=\"input-color\"><input type=\"text\" style = \"width: 70%;\" value=\"" + alltxt[j] + "\t(N = " + sum + ")\" /><div class=\"color-box\" style=\"background-color:" + colors[j] + ";\"></div></div></li>";
  //}
  //str += "</ul>";
  var str =
    '<div style="box-shadow:none;" class="info legend leaflet-control">';
  for (var j = 0; j < alltxt.length; j++) {
    var sum = 0;
    for (var i = 0; i < piechartarray.length; i++) {
      sum += parseInt(piechartarray[i].Count[j]);
    }
    //str += "<i style=\"background:" + colors[j] + "\"></i>" + alltxt[j] + "\t(N = " + sum +  ")<br>";
    str +=
      '<input type="color" value="' +
      colors[j] +
      '" id="colorWell' +
      j +
      '">\t' +
      alltxt[j] +
      "\t(N = " +
      sum +
      ")<br>";
  }
  str += "</div>";
  $("#legend").html(str);
  for (var j = 0; j < alltxt.length; j++) {
    colorWell[j] = document.querySelector("#colorWell" + j);
    colorWell[j].addEventListener("change", updateAll, false);
  }
  //Добавляем легенду на карту
  map.removeControl(Legend);
  Legend.onAdd = function (map) {
    var div = L.DomUtil.create("div", "info legend");
    for (var i = 0; i < alltxt.length; i++) {
      var sum = 0;
      for (var j = 0; j < piechartarray.length; j++) {
        sum += parseInt(piechartarray[j].Count[i]);
      }
      div.innerHTML +=
        '<i style="background:' +
        colors[i] +
        '"></i> ' +
        alltxt[i] +
        "\t(N = " +
        sum +
        ")<br>";
    }
    return div;
  };
  Legend.addTo(map);
  //Фокусируемся на входящих маркерах
  if (piechartarray.length != 0) {
    var group = new L.LatLngBounds(bounds);
    map.fitBounds(group);
  }
}
function updateAll(event) {
  var str = event.target.id;
  colors[str.substring(9)] = event.target.value;
  redrawPieChart();
  Legend.setPosition("bottomright");
}
function redrawPieChart() {
  clearMap();
  var max = Math.max.apply(
    Math,
    piechartarray.map(function (o) {
      return o.Total;
    })
  );
  var min = Math.min.apply(
    Math,
    piechartarray.map(function (o) {
      return o.Total;
    })
  );
  for (var i = piechartarray.length - 1; i >= 0; i--) {
    var data = {};
    var chartOptions = {};
    if (radius_toggle.checked) {
      var radius =
        9 +
        ((parseInt(radius_slider.value) - 8) * (piechartarray[i].Total - min)) /
          (max - min);
      if (!radius) {
        radius = 15;
      }
    } else {
      radius = parseInt(radius_slider.value);
    }
    for (var j = 0; j < alltxt.length; j++) {
      if (piechartarray[i].Count[j] != 0) {
        (data[alltxt[j].trim()] =
          piechartarray[i].Count[j] / piechartarray[i].Total),
          (chartOptions[alltxt[j].trim()] = {
            fillColor: colors[j],
            color: "#000000",
            displayText: function (value) {
              return (value * 100).toFixed(1).toString() + "%";
            },
          });
      }
    }
    var options = {
      radius: radius,
      fillOpacity: 1,
      data: data,
      chartOptions: chartOptions,
    };
    var bchMarker = new L.PieChartMarker(
      new L.LatLng(piechartarray[i].Latitude, piechartarray[i].Longitude),
      options
    );
    var str =
      "<h5>" +
      piechartarray[i].fullname +
      '</h5><table class="table table-condensed"><tr><th>Item</th><th style="width: 64px;">Count</th></tr>';
    for (var j = 0; j < alltxt.length; j++) {
      if (piechartarray[i].Count[j] != 0) {
        str += "<tr>";
        str +=
          '<td style="font-weight: bold;"><div class="data-layer-legend"><div class="legend-box" style="background-color:' +
          colors[j] +
          ';"></div><div class="key">' +
          alltxt[j] +
          "</div></div></td>";
        str +=
          "<td  style='width: 64px;'>" + piechartarray[i].Count[j] + "</td>";
        str += "</tr>";
      }
    }
    str += "</table>";
    bchMarker.bindPopup(str, {
      minWidth: 400,
    });
    bchMarker.addTo(piechartLayer);
  }
  //Добавляем итоговый слой PieChart маркеров на карту
  map.addLayer(piechartLayer);
}
function getDatafromShapeTxt(val) {
  if (val === "") {
    document.getElementById("messagesShape").innerHTML = "Empty string!";
    return;
  }

  geojson.clearLayers();
  nodataflag = false;
  document.getElementById("messagesShape").innerHTML = "";

  showLoading(true);

  if (typeof RFregionsData == "undefined") {
    $.loadScript("./static/data/RFregions.js", function () {
      drawShapes(val);
    });
  }
  else {
    drawShapes(val);
  }
}

function drawShapes(val) {
  val = val.replace(/,/g, ".");
  var records_list = val.trim().split(/\r?\n/);
  var parametr = records_list[0].split("*");
  if (!parametr[1]) {
    parametr[1] = "";
  }
  records_list.shift();
  var i = 0;
  RFregionsData.features.forEach(function (features) {
    features.properties.custom = records_list[i];
    if (!records_list[i]) {
      nodataflag = true;
    }
    i++;
  });
  var i = 0,
    q = records_list.length;
  while (i < q) {
    if (!records_list[i]) {
      records_list.splice(i, 1);
      q--;
    } else {
      i++;
    }
  }
  var max = Math.max.apply(Math, records_list);
  var min = Math.min.apply(Math, records_list);
  max = Math.log(max);
  min = Math.log(min);
  grades[0] = min;
  var z = (max - min) / 8;
  for (i = 1; i < 8; i++) {
    grades[i] = grades[i - 1] + z;
  }
  for (i = 0; i < 8; i++) {
    grades[i] = Math.pow(2.71828, grades[i]);
    grades[i] > 1
      ? (grades[i] = Math.floor(grades[i]))
      : (grades[i] = grades[i].toFixed(3));
  }
  geojson = L.geoJson(RFregionsData, {
    style: customstyle,
    onEachFeature: onEachFeature,
  })
    .bindPopup(function (layer) {
      var str =
        layer.feature.properties.name +
        "<br>" +
        parametr[0] +
        ": " +
        layer.feature.properties.custom +
        " " +
        parametr[1];
      return str;
    })
    .addTo(map);
  function onEachFeature(feature, layer) {
    layer.on({
      mouseover: highlightFeature,
      mouseout: resetHighlight,
    });
  }
  function resetHighlight(e) {
    geojson.resetStyle(e.target);
  }
  function highlightFeature(e) {
    var layer = e.target;
    layer.setStyle({
      weight: 3,
      color: "#666",
      dashArray: "",
      fillOpacity: 0.7,
    });
    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
      layer.bringToFront();
    }
  }
  legendShape.addTo(map);
  map.setView([66.73, 100.99], 3);
  showLoading(false);
}

function showDensity() {
  geojson.clearLayers();
  showLoading(true);
  grades = [0, 10, 20, 50, 100, 200, 500, 1000];
  nodataflag = false;

  geojson = L.geoJson(RFregionsData, {
    style: style,
    onEachFeature: onEachFeature,
  })
    .bindPopup(function (layer) {
      var str =
        layer.feature.properties.name +
        "<br> Плотность населения: " +
        layer.feature.properties.density +
        " чел/км²";
      return str;
    })
    .addTo(map);
  function onEachFeature(feature, layer) {
    layer.on({
      mouseover: highlightFeature,
      mouseout: resetHighlight,
    });
  }
  function resetHighlight(e) {
    geojson.resetStyle(e.target);
  }
  function highlightFeature(e) {
    var layer = e.target;
    layer.setStyle({
      weight: 3,
      color: "#666",
      dashArray: "",
      fillOpacity: 0.7,
    });
    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
      layer.bringToFront();
    }
  }
  legendShape.addTo(map);
  map.setView([66.73, 100.99], 3);
  showLoading(false);
}
legendShape.onAdd = function (map) {
  var div = L.DomUtil.create("div", "info legend");
  // loop through our density intervals and generate a label with a colored square for each interval
  var div_html = '';
  if (nodataflag) {
    div_html += '<i style="background:#8ed2a3"></i>Нет данных<br>';
  }
  for (var i = 0; i < grades.length; i++) {
    div_html +=
      '<i style="background:' +
      getColor(grades[i] + 1) +
      '"></i> ' +
      grades[i] +
      (grades[i + 1] ? "&ndash;" + grades[i + 1] + '<br/>' : "+");
  }
  div.innerHTML = div_html;

  console.log(div);
  return div;
};
function getColor(d) {
  return !d
    ? "#8ed2a3"
    : d > grades[7]
    ? "#800026"
    : d > grades[6]
    ? "#BD0026"
    : d > grades[5]
    ? "#E31A1C"
    : d > grades[4]
    ? "#FC4E2A"
    : d > grades[3]
    ? "#FD8D3C"
    : d > grades[2]
    ? "#FEB24C"
    : d > grades[1]
    ? "#FED976"
    : "#FFEDA0";
}
function customstyle(feature) {
  return {
    fillColor: getColor(feature.properties.custom),
    weight: 1,
    opacity: 1,
    color: "white",
    dashArray: "",
    fillOpacity: 0.7,
  };
}
function style(feature) {
  return {
    fillColor: getColor(feature.properties.density),
    weight: 1,
    opacity: 1,
    color: "white",
    dashArray: "",
    fillOpacity: 0.7,
  };
}
function calcCities(val) {
  var data = arrayFreq(val);
  var res = [];
  for (var i = 0; i < data[0].length; i++) {
    res.push({
      name: data[0][i],
      count: data[1][i],
      perc: ((data[1][i] / data[2]) * 100).toFixed(2),
    });
  }
  res.push({ name: "", count: data[2], perc: "100.00" });
  fillTableStat(res);
  $("#citiesStatModal").modal("show");
}
function arrayFreq(txt) {
  var a = [],
    b = [],
    sum = 0,
    prev;
  var arr = txt.trim().split(/\r?\n/);
  arr.sort();
  for (var i = 0; i < arr.length; i++) {
    if (arr[i] !== prev) {
      a.push(arr[i]);
      b.push(1);
    } else {
      b[b.length - 1]++;
    }
    prev = arr[i];
  }
  sum = b.reduce((x, y) => x + y, 0);
  return [a, b, sum];
}
// ====== Copy Table =====
function copytable(val, msg) {
  var el = document.getElementById(val);
  var body = document.body,
    range,
    sel;
  if (document.createRange && window.getSelection) {
    range = document.createRange();
    sel = window.getSelection();
    sel.removeAllRanges();
    try {
      range.selectNodeContents(el);
      sel.addRange(range);
    } catch (e) {
      range.selectNode(el);
      sel.addRange(range);
    }
  } else if (body.createTextRange) {
    range = body.createTextRange();
    range.moveToElementText(el);
    range.select();
  }
  document.execCommand("copy");
  sel.removeAllRanges();
  document.getElementById(msg).innerHTML = "Copied!";
}

function closeModal(modal, msg) {
  document.getElementById(msg).innerHTML = "";
  $("#" + modal).modal("hide");
}
// ====== Geocoding ======
function getCoordFromGoogle(val) {
  if (val != "") {
    PieChart = false;
    nextAddress = 0;
    delay = 1000;
    cities = [];
    cities_list = val.trim().split(/\r?\n/).filter(onlyUnique);
    showLoading(true);
    document.getElementById("messagesPin").innerHTML = "";
    theNext();
  } else {
    document.getElementById("messagesPin").innerHTML = "Empty string!";
  }
}

function theNext() {
  var elementsLen =
    PieChart === true ? piechartarray.length : cities_list.length;
  var elements = PieChart === true ? piechartarray : cities_list;
  if (nextAddress < elementsLen) {
    var elementsVal =
      PieChart === true ? elements[nextAddress].City : elements[nextAddress];
    setTimeout('getAddress("' + elementsVal + '",theNext)', delay);
    nextAddress++;
  } else {
    // We're done. Show map bounds
    if (cities.length != 0) {
      if (PieChart == false) {
        updateMap();
        fillTable();
      } else {
        makePiechart();
      }
    }
    showLoading(false);
  }
}

function getDataGoogle(search, next) {
  setCurrentLoading("Loading from Google: " + search);
  geo.geocode({ address: search }, function (results, status) {
    // If that was successful
    if (status == google.maps.GeocoderStatus.OK) {
      var obj = {
        txtName: search,
        fullname: results[0].formatted_address,
        lat:
          Math.round(results[0].geometry.location.lat() * 10000000) / 10000000,
        lon:
          Math.round(results[0].geometry.location.lng() * 10000000) / 10000000,
      };
      cities.push(obj);
    }
    // ====== Decode the error status ======
    else {
      // === if we were sending the requests to fast, try this one again and increase the delay
      if (status == google.maps.GeocoderStatus.OVER_QUERY_LIMIT) {
        nextAddress--;
        delay++;
      } else {
        logErr(status, search);
      }
    }
    next();
  });
}

function getDataNomnatim(search, next) {
  setCurrentLoading("Loading from Nominatim: " + search);
  let xml = new XMLHttpRequest();
  var url =
    "https://nominatim.openstreetmap.org/search?q=" +
    search +
    "&limit=1&format=json";
  // the function with the 3 parameters
  xml.open("GET", url, true);
  // the function called when an xhr transaction is completed
  xml.onload = function () {
    if (this.status == 200) {
      var geo = JSON.parse(this.responseText);
      var obj = {
        txtName: search,
        fullname: geo[0].display_name,
        lat: Math.round(+geo[0].lat * 10000000) / 10000000,
        lon: Math.round(+geo[0].lon * 10000000) / 10000000,
      };
      cities.push(obj);
    } else {
      logErr(status, search);
    }
    next();
  };
  // the function that sends the request
  xml.send();
}

function getAddress(search, next) {
  if (IS_GOOGLE === "google") {
    getDataGoogle(search, next);
  } else {
    getDataNomnatim(search, next);
  }
}
