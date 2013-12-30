var map;
var placeNames = new Array();
var DayzIcon = L.Icon.extend({
	options : {
		iconSize : [32, 37],
		iconAnchor : [15, 36],
		popupAnchor : [0, -38]
	}
});

$(function() {
	var tileJson = {
		"center" : [0, 0, 2],
	};

	map = L.mapbox.map('map', tileJson, {
		minZoom : 2,
		maxZoom : 7
	});

	var rootLayer = L.tileLayer('tiles/{z}/{x}/{y}.png', {
		attribution : 'Created by rukqoa',
		noWrap : true,
		crs : L.CRS.Simple
	}).addTo(map);

	var signs = listCities();

	var pumps = L.layerGroup(addPump()).addTo(map);
	map.addLayer(addMarker());
	map.addLayer(addWater());
	var smallSigns = L.layerGroup(signs.small);
	var mediumSigns = L.layerGroup(signs.medium);
	var largeSigns = L.layerGroup(signs.large).addTo(map);

	map.on('zoomend', function() {
		if (map.getZoom() >= 5) {
		} else if (map.getZoom() >= 4) {
			smallSigns.addTo(map);
		} else if (map.getZoom() >= 3) {
			mediumSigns.addTo(map);
			map.removeLayer(smallSigns);
		} else {
			largeSigns.addTo(map);
			map.removeLayer(smallSigns);
			map.removeLayer(mediumSigns);
		}

	});

});

function clickMarker(e) {
	$("#lootinfo").html(formatLoot(lootz[e.target.options.className]));
	$(".subtitle").html("(" + e.target.options.className + ")");
}

function formatLoot(json) {
	var display = "";
	$.each(json, function(index, value) {
		display += '<ul><span class="bold">' + index.capitalize() + "</span>";

		for (var i = 0; i < value.length; i++) {
			display += "<li>" + value[i].name + ": " + value[i].loot + "%</li>";
		}

		display += "</ul>";
	});
	return display;
}

function addWater() {
	var iWaterDrop = new DayzIcon({
		iconUrl : 'icons/waterdrop.png'
	});
	var waterSource = new L.MarkerClusterGroup({
		spiderfyOnMaxZoom : false,
		maxClusterRadius : 40,
		iconCreateFunction : function(cluster) {
			return iWaterDrop;
		},
	}).on('clusterclick', function(a) {
		a.layer.zoomToBounds();
	});
	$.each(names, function(i, v) {
		if (v.type == "WaterSource") {
			var source = L.marker(cord(v), {
				icon : iWaterDrop,
				clickable : false
			});
			waterSource.addLayer(source);
		}
	});
	return waterSource;
}

function addMarker() {
	var markers = new L.MarkerClusterGroup({
		spiderfyOnMaxZoom : false,
		disableClusteringAtZoom : 6
	}).on('clusterclick', function(a) {
		a.layer.zoomToBounds();
	});
	$.each(wrp_land_classes, function(index, v) {
		var positions = v[1];
		if (lootLocations.contains(v[0].toLowerCase())) {
			for (var i = 0; i < positions.length; i++) {
				var loc = positions[i];
				var source = L.circleMarker(cord({
					position : [loc[0], loc[1]]
				}), {
					radius : 5,
					opacity : 1,
					color : "#6495ED",
					weight : 5,
					fillColor : "#6495ED",
					fillOpacity : 0.5,
					className : v[0],
					zIndexOffset : 500
				}).on('click', clickMarker);
				markers.addLayer(source);
			}
		}
	});
	return markers;
}

function addPump() {
	var iWaterPump = new DayzIcon({
		iconUrl : 'icons/waterwellpump.png'
	});
	var pumps = [];
	$.each(wrp_land_classes, function(i, v) {
		if (v[0] == "land_pumpa") {
			var positions = v[1];
			for (var i = 0; i < positions.length; i++) {
				var loc = positions[i];
				var pump = L.marker(cord({
					position : [loc[0], loc[1]]
				}), {
					icon : iWaterPump,
					clickable : false
				});
				pumps.push(pump);
			}
		}
	});
	return pumps;
}

function listCities() {
	var large = [], medium = [], small = [];
	$.each(names, function(index, value) {
		var feat = buildCity(index, value);
		if (feat) {
			if (value.type == "NameLocal" || value.type == "Hill" || value.type == "NameMarine")
				small.push(feat);
			else if ((value.type == "NameCity" || value.type == "NameCityCapital") && value.radiusB > 180)
				large.push(feat);
			else
				medium.push(feat);
		}
	});

	return {
		large : large,
		medium : medium,
		small : small
	};
}

function buildCity(index, value) {
	var pos = cord(value);
	var display = "";
	var formatting = "";
	var textname = strings[value.name.substring(1).toUpperCase()];
	if (textname) {
		display = textname.English + '<br /><span class="russian">' + textname.Russian + "</span>";
		if (value.type == "NameLocal" || value.type == "Hill" || value.type == "NameMarine")
			formatting = "local";
		else if ((value.type == "NameCity" || value.type == "NameCityCapital") && value.radiusB > 180)
			formatting = "city";
		else
			formatting = "village";
	} else if (value.speech) {
		display = value.speech[0].capitalize();
		formatting = "local";
	} else if (value.name != "") {
		display = value.name;
		formatting = "local";
	}

	if (display != "")
		placeNames.push(display);

	var feat = L.marker(pos, {
		icon : L.divIcon({
			className : formatting,
			html : display,
			iconSize : [200, 30],
			iconAnchor : [100, 15]
		}),
		zIndexOffset : 1000
	});
	return feat;
}

function cord(value) {
	return map.unproject([value.position[0] / 15360 * 1024, (15360 - value.position[1]) / 15360 * 1024]);
}

Array.prototype.contains = function(obj) {
	var i = this.length;
	while (i--) {
		if (this[i] === obj) {
			return true;
		}
	}
	return false;
};

String.prototype.capitalize = function() {
	return this.charAt(0).toUpperCase() + this.slice(1);
};
