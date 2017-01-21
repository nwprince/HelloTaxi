//Function: Creates a map object using the Google Maps API and calculates the
//optimal taxi route for travel. The duration and distance of travel are
//calculated and stored for further use by the system. The destination, location
//and name of the user are queried. The name is displayed within a greeting to
//the service.
function initialize() {
  var userLocation = CB.CloudUser.current.get('userLocation');
  var userDestination = CB.CloudUser.current.get('userDestination');
  var fName = CB.CloudUser.current.get('fName');
  var a = document.getElementById("name").innerHTML=fName+', your taxi will arrive soon.';
  var directionsService = new google.maps.DirectionsService;
  var directionsDisplay = new google.maps.DirectionsRenderer({ draggable: true,
  map: map, preserveViewport: true});
  var map = new google.maps.Map(document.getElementById('map'), {
    center: userLocation,
    zoom: 12,
    disableDefaultUI: true,
    styles: [
      {
        "featureType": "water",
        "elementType": "all",
        "stylers": [
          {
            "hue": "#7fc8ed"
          },
          {
            "saturation": 55
          },
          {
            "lightness": -6
          },
          {
            "visibility": "on"
          }
        ]
      },
      {
        "featureType": "water",
        "elementType": "labels",
        "stylers": [
          {
            "hue": "#7fc8ed"
          },
          {
            "saturation": 55
          },
          {
            "lightness": -6
          },
          {
            "visibility": "off"
          }
        ]
      },
      {
        "featureType": "poi.park",
        "elementType": "geometry",
        "stylers": [
          {
            "hue": "#83cead"
          },
          {
            "saturation": 1
          },
          {
            "lightness": -15
          },
          {
            "visibility": "on"
          }
        ]
      },
      {
        "featureType": "landscape",
        "elementType": "geometry",
        "stylers": [
          {
            "hue": "#f3f4f4"
          },
          {
            "saturation": -84
          },
          {
            "lightness": 59
          },
          {
            "visibility": "on"
          }
        ]
      },
      {
        "featureType": "landscape",
        "elementType": "labels",
        "stylers": [
          {
            "hue": "#ffffff"
          },
          {
            "saturation": -100
          },
          {
            "lightness": 100
          },
          {
            "visibility": "off"
          }
        ]
      },
      {
        "featureType": "road",
        "elementType": "geometry",
        "stylers": [
          {
            "hue": "#ffffff"
          },
          {
            "saturation": -100
          },
          {
            "lightness": 100
          },
          {
            "visibility": "on"
          }
        ]
      },
      {
        "featureType": "road",
        "elementType": "labels",
        "stylers": [
          {
            "hue": "#bbbbbb"
          },
          {
            "saturation": -100
          },
          {
            "lightness": 26
          },
          {
            "visibility": "on"
          }
        ]
      },
      {
        "featureType": "road.arterial",
        "elementType": "geometry",
        "stylers": [
          {
            "hue": "#ffcc00"
          },
          {
            "saturation": 100
          },
          {
            "lightness": -35
          },
          {
            "visibility": "simplified"
          }
        ]
      },
      {
        "featureType": "road.highway",
        "elementType": "geometry",
        "stylers": [
          {
            "hue": "#ffcc00"
          },
          {
            "saturation": 100
          },
          {
            "lightness": -22
          },
          {
            "visibility": "on"
          }
        ]
      },
      {
        "featureType": "poi.school",
        "elementType": "all",
        "stylers": [
          {
            "hue": "#d7e4e4"
          },
          {
            "saturation": -60
          },
          {
            "lightness": 23
          },
          {
            "visibility": "on"
          }
        ]
      }
    ]
  });
  var map = new google.maps.Map(document.getElementById('location-canvas'),
map);
  directionsDisplay.setMap(map);
  calculateAndDisplayRoute(directionsService, directionsDisplay, userLocation, userDestination);
}
function calculateAndDisplayRoute(directionsService, directionsDisplay, userLocation, userDestination) {
  directionsService.route({
    origin: userLocation,
    destination: userDestination,
    travelMode: 'DRIVING'
  }, function(response, status) {
    if (status === 'OK') {
      directionsDisplay.setDirections(response);
      var duration = directionsDisplay.directions.routes[0].legs[0].duration.text;
      var distance = directionsDisplay.directions.routes[0].legs[0].distance.text;
      updateDetails(duration, distance);
    } else {
      window.alert('Directions request failed due to ' + status);
    }
  });
}
function updateDetails(duration, distance) {
  var z = document.getElementById("duration").innerHTML=duration;
  var y = document.getElementById("distance").innerHTML=distance;
  updateTransaction(distance);
}
google.maps.event.addDomListener(window, 'resize', initialize);
google.maps.event.addDomListener(window, 'load', initialize);
